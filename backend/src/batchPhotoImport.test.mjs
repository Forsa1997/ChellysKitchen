import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBatchPhotoImportJobs, MAX_BATCH_PHOTOS } from './batchPhotoImport.mjs';

function photo(name) {
  return { fileName: name, ext: 'png', mime: 'image/png', buffer: Buffer.from(name) };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test('MAX_BATCH_PHOTOS bounds a batch', () => {
  assert.ok(Number.isInteger(MAX_BATCH_PHOTOS) && MAX_BATCH_PHOTOS >= 1);
});

test('a job processes photos sequentially and records one result per photo', async () => {
  const calls = [];
  const jobs = createBatchPhotoImportJobs({
    extractRecipe: async (entry) => {
      calls.push(entry.fileName);
      if (entry.fileName === 'katze.png') return null;
      if (entry.fileName === 'kaputt.png') throw new Error('Gemini down');
      return { title: `Rezept aus ${entry.fileName}` };
    },
    createRecipeFromPhoto: async ({ recipe }) => ({
      id: 'r_1',
      slug: 'rezept-aus-a-png',
      title: recipe.title,
    }),
  });

  const started = jobs.startJob({
    photos: [photo('a.png'), photo('katze.png'), photo('kaputt.png')],
    createdBy: { id: 'user_1', name: 'Admin' },
  });

  assert.equal(started.status, 'RUNNING');
  assert.equal(started.total, 3);
  assert.equal(started.processed, 0);
  // Processing starts synchronously with the first photo; the rest queue up.
  assert.deepEqual(started.items.map((item) => item.status), ['PROCESSING', 'PENDING', 'PENDING']);

  await jobs.waitForJob(started.id);
  const finished = jobs.getJob(started.id);

  assert.equal(finished.status, 'COMPLETED');
  assert.ok(finished.finishedAt);
  assert.equal(finished.processed, 3);
  assert.equal(finished.created, 1);
  assert.equal(finished.noRecipe, 1);
  assert.equal(finished.failed, 1);
  assert.deepEqual(calls, ['a.png', 'katze.png', 'kaputt.png']);

  assert.equal(finished.items[0].status, 'CREATED');
  assert.deepEqual(finished.items[0].recipe, { id: 'r_1', slug: 'rezept-aus-a-png', title: 'Rezept aus a.png' });
  assert.equal(finished.items[1].status, 'NO_RECIPE');
  assert.equal(finished.items[2].status, 'FAILED');
  assert.match(finished.items[2].error, /Gemini down/);
});

test('createRecipeFromPhoto receives the photo and the job context', async () => {
  let received;
  const jobs = createBatchPhotoImportJobs({
    extractRecipe: async () => ({ title: 'Pfannkuchen' }),
    createRecipeFromPhoto: async (args) => {
      received = args;
      return { id: 'r_2', slug: 'pfannkuchen', title: 'Pfannkuchen' };
    },
  });

  const started = jobs.startJob({
    photos: [photo('seite.png')],
    createdBy: { id: 'user_1', name: 'Admin' },
    context: { baseUrl: 'http://example.test' },
  });
  await jobs.waitForJob(started.id);

  assert.equal(received.photo.fileName, 'seite.png');
  assert.equal(received.recipe.title, 'Pfannkuchen');
  assert.equal(received.context.baseUrl, 'http://example.test');
});

test('hasRunningJob reflects the in-flight job', async () => {
  const gate = deferred();
  const jobs = createBatchPhotoImportJobs({
    extractRecipe: () => gate.promise,
    createRecipeFromPhoto: async () => ({ id: 'r', slug: 's', title: 't' }),
  });

  assert.equal(jobs.hasRunningJob(), false);
  const started = jobs.startJob({ photos: [photo('a.png')], createdBy: { id: 'u', name: 'A' } });
  assert.equal(jobs.hasRunningJob(), true);

  gate.resolve(null);
  await jobs.waitForJob(started.id);
  assert.equal(jobs.hasRunningJob(), false);
});

test('getJob returns null for unknown ids, listJobs is newest first', async () => {
  let tick = Date.parse('2026-01-01T10:00:00Z');
  const jobs = createBatchPhotoImportJobs({
    extractRecipe: async () => null,
    createRecipeFromPhoto: async () => ({ id: 'r', slug: 's', title: 't' }),
    now: () => tick,
  });

  assert.equal(jobs.getJob('nope'), null);

  const first = jobs.startJob({ photos: [photo('a.png')], createdBy: { id: 'u', name: 'A' } });
  await jobs.waitForJob(first.id);
  tick += 60_000;
  const second = jobs.startJob({ photos: [photo('b.png')], createdBy: { id: 'u', name: 'A' } });
  await jobs.waitForJob(second.id);

  assert.deepEqual(jobs.listJobs().map((job) => job.id), [second.id, first.id]);
});

test('finished jobs are pruned after the retention window', async () => {
  let tick = Date.parse('2026-01-01T10:00:00Z');
  const jobs = createBatchPhotoImportJobs({
    extractRecipe: async () => null,
    createRecipeFromPhoto: async () => ({ id: 'r', slug: 's', title: 't' }),
    now: () => tick,
    retentionMs: 60_000,
  });

  const old = jobs.startJob({ photos: [photo('a.png')], createdBy: { id: 'u', name: 'A' } });
  await jobs.waitForJob(old.id);

  tick += 61_000;
  assert.equal(jobs.listJobs().length, 0);
  assert.equal(jobs.getJob(old.id), null);
});
