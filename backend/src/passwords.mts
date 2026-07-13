import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const SCRYPT_KEYLEN = 64;

export interface PasswordCredential {
  algo: 'scrypt';
  salt: string;
  hash: string;
}

/** The credential fields stored on a user record. */
export interface StoredCredential {
  passwordHash: string;
  salt: string;
  algo?: string;
}

export interface VerifyResult {
  valid: boolean;
  needsRehash: boolean;
}

function scryptHex(password: string, salt: string): string {
  return scryptSync(String(password), salt, SCRYPT_KEYLEN).toString('hex');
}

function sha256Hex(password: string, salt: string): string {
  return createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * Hash a password with scrypt (memory-hard, built into node:crypto — unlike
 * the previous single-round SHA-256, this resists offline brute-forcing if
 * the store file ever leaks).
 */
export function hashPassword(password: string, salt: string = randomBytes(16).toString('hex')): PasswordCredential {
  return { algo: 'scrypt', salt, hash: scryptHex(password, salt) };
}

/**
 * Verify a password against a stored credential. Users created before the
 * scrypt switch carry legacy SHA-256 hashes (no `algo` field); they still
 * verify, but `needsRehash` tells the caller to upgrade the stored hash now
 * that the plaintext password is available.
 */
export function verifyPassword(credential: StoredCredential, password: string): VerifyResult {
  const { passwordHash, salt, algo } = credential;
  const calculated = algo === 'scrypt' ? scryptHex(password, salt) : sha256Hex(password, salt);
  const valid = safeEqualHex(calculated, passwordHash);

  return { valid, needsRehash: valid && algo !== 'scrypt' };
}
