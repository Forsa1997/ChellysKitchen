// Batch photo import: one job takes many recipe photos and processes them
// sequentially through the Gemini extractor; every recognized photo becomes
// an unpublished draft via the injected createRecipeFromPhoto callback.
//
// Jobs are deliberately in-memory only — they are transient progress state
// for the admin dashboard. The created recipes themselves go through the
// normal persistent store and survive a restart; an interrupted job simply
// disappears and can be restarted with the remaining photos.

import { randomBytes } from 'node:crypto';

export const MAX_BATCH_PHOTOS = 10;

const JOB_RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_FINISHED_JOBS = 20;

export function createBatchPhotoImportJobs({
  extractRecipe,
  createRecipeFromPhoto,
  now = () => Date.now(),
  retentionMs = JOB_RETENTION_MS,
  maxFinishedJobs = MAX_FINISHED_JOBS,
}) {
  const jobs = new Map(); // job id -> mutable job record
  const runners = new Map(); // job id -> processing promise (for tests/shutdown)

  function prune() {
    const cutoff = now() - retentionMs;
    const finished = [...jobs.values()]
      .filter((job) => job.status === 'COMPLETED')
      .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
    for (const job of finished) {
      if (Date.parse(job.finishedAt) <= cutoff) jobs.delete(job.id);
    }
    const remaining = finished.filter((job) => jobs.has(job.id));
    for (const job of remaining.slice(0, Math.max(0, remaining.length - maxFinishedJobs))) {
      jobs.delete(job.id);
    }
  }

  function toSnapshot(job) {
    let created = 0;
    let noRecipe = 0;
    let failed = 0;
    for (const item of job.items) {
      if (item.status === 'CREATED') created += 1;
      else if (item.status === 'NO_RECIPE') noRecipe += 1;
      else if (item.status === 'FAILED') failed += 1;
    }
    return {
      id: job.id,
      status: job.status,
      createdAt: job.createdAt,
      finishedAt: job.finishedAt,
      createdBy: job.createdBy,
      total: job.items.length,
      processed: created + noRecipe + failed,
      created,
      noRecipe,
      failed,
      items: job.items.map((item) => ({ ...item, ...(item.recipe ? { recipe: { ...item.recipe } } : {}) })),
    };
  }

  async function processJob(job, photos, context) {
    for (const [index, photo] of photos.entries()) {
      const item = job.items[index];
      item.status = 'PROCESSING';
      try {
        const recipe = await extractRecipe(photo, context);
        if (!recipe) {
          item.status = 'NO_RECIPE';
          continue;
        }
        const draft = await createRecipeFromPhoto({ recipe, photo, context });
        item.status = 'CREATED';
        item.recipe = { id: draft.id, slug: draft.slug, title: draft.title };
      } catch (error) {
        item.status = 'FAILED';
        item.error = String(error?.message ?? 'Unbekannter Fehler.').slice(0, 300);
      }
    }
    job.status = 'COMPLETED';
    job.finishedAt = new Date(now()).toISOString();
    runners.delete(job.id);
  }

  function startJob({ photos, createdBy, context = {} }) {
    prune();
    const job = {
      id: `batch_${randomBytes(8).toString('hex')}`,
      status: 'RUNNING',
      createdAt: new Date(now()).toISOString(),
      finishedAt: null,
      createdBy,
      items: photos.map((photo, index) => ({
        index,
        fileName: String(photo.fileName ?? `Foto ${index + 1}`).slice(0, 200),
        status: 'PENDING',
      })),
    };
    jobs.set(job.id, job);
    runners.set(job.id, processJob(job, photos, context));
    return toSnapshot(job);
  }

  return {
    startJob,
    hasRunningJob: () => [...jobs.values()].some((job) => job.status === 'RUNNING'),
    getJob: (id) => {
      const job = jobs.get(id);
      return job ? toSnapshot(job) : null;
    },
    listJobs: () => {
      prune();
      return [...jobs.values()]
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .map(toSnapshot);
    },
    /** Resolves when the job's processing loop has finished (tests/shutdown). */
    waitForJob: (id) => runners.get(id) ?? Promise.resolve(),
  };
}
