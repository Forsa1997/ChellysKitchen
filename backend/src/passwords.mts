import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_KEYLEN = 64;

function scryptHex(password, salt) {
  return scryptSync(String(password), salt, SCRYPT_KEYLEN).toString('hex');
}

function sha256Hex(password, salt) {
  return createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

function safeEqualHex(a, b) {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Hash a password with scrypt (memory-hard, built into node:crypto — unlike
 * the previous single-round SHA-256, this resists offline brute-forcing if
 * the store file ever leaks).
 */
export function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  return { algo: 'scrypt', salt, hash: scryptHex(password, salt) };
}

/**
 * Verify a password against a stored credential. Users created before the
 * scrypt switch carry legacy SHA-256 hashes (no `algo` field); they still
 * verify, but `needsRehash` tells the caller to upgrade the stored hash now
 * that the plaintext password is available.
 */
export function verifyPassword(credential, password) {
  const { passwordHash, salt, algo } = credential;
  const calculated = algo === 'scrypt' ? scryptHex(password, salt) : sha256Hex(password, salt);
  const valid = safeEqualHex(calculated, passwordHash);

  return { valid, needsRehash: valid && algo !== 'scrypt' };
}
