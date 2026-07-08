import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { hashPassword, verifyPassword } from './passwords.mjs';

test('hashPassword produces a scrypt credential that verifies', () => {
  const credential = hashPassword('geheim123');

  assert.equal(credential.algo, 'scrypt');
  assert.ok(credential.salt.length >= 32);
  assert.ok(credential.hash.length > 64);

  const result = verifyPassword(
    { passwordHash: credential.hash, salt: credential.salt, algo: credential.algo },
    'geheim123',
  );
  assert.equal(result.valid, true);
  assert.equal(result.needsRehash, false);
});

test('verifyPassword rejects a wrong password', () => {
  const credential = hashPassword('geheim123');
  const result = verifyPassword(
    { passwordHash: credential.hash, salt: credential.salt, algo: credential.algo },
    'falsch',
  );
  assert.equal(result.valid, false);
});

test('verifyPassword still accepts legacy sha256 hashes and flags them for rehash', () => {
  const salt = 'somesalt';
  const legacyHash = createHash('sha256').update(`${salt}:geheim123`).digest('hex');

  const result = verifyPassword({ passwordHash: legacyHash, salt }, 'geheim123');
  assert.equal(result.valid, true);
  assert.equal(result.needsRehash, true);

  const wrong = verifyPassword({ passwordHash: legacyHash, salt }, 'falsch');
  assert.equal(wrong.valid, false);
});
