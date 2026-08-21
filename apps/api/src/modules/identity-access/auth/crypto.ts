import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

export const passwordPolicy = {
  minLength: 12,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireDigit: true,
  requireSymbol: true,
} as const;
export type PasswordHash = { hash: string; salt: string; cost: number; blockSize: number; parallelization: number };
const parameters = { cost: 16384, blockSize: 8, parallelization: 1, keyLength: 64 } as const;

export function validatePassword(password: string): string[] {
  const errors: string[] = [];
  if (password.length < passwordPolicy.minLength) errors.push("password_too_short");
  if (password.length > passwordPolicy.maxLength) errors.push("password_too_long");
  if (!/[A-Z]/.test(password)) errors.push("password_requires_uppercase");
  if (!/[a-z]/.test(password)) errors.push("password_requires_lowercase");
  if (!/\d/.test(password)) errors.push("password_requires_digit");
  if (!/[^A-Za-z0-9]/.test(password)) errors.push("password_requires_symbol");
  return errors;
}
export function hashPassword(password: string): PasswordHash {
  const errors = validatePassword(password);
  if (errors.length) throw new Error(errors.join(","));
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, parameters.keyLength, {
    N: parameters.cost,
    r: parameters.blockSize,
    p: parameters.parallelization,
  }).toString("base64url");
  return {
    hash,
    salt,
    cost: parameters.cost,
    blockSize: parameters.blockSize,
    parallelization: parameters.parallelization,
  };
}
export function verifyPassword(password: string, stored: PasswordHash): boolean {
  const actual = scryptSync(password, stored.salt, parameters.keyLength, {
    N: stored.cost,
    r: stored.blockSize,
    p: stored.parallelization,
  });
  const expected = Buffer.from(stored.hash, "base64url");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
export function createOpaqueToken(bytes = 32): { token: string; tokenHash: string } {
  const token = randomBytes(bytes).toString("base64url");
  return { token, tokenHash: hashToken(token) };
}
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
