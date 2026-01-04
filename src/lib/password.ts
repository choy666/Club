import bcrypt from "bcryptjs";

const DEFAULT_SALT_ROUNDS = 12;

export async function hashPassword(plainText: string, saltRounds = DEFAULT_SALT_ROUNDS) {
  return bcrypt.hash(plainText, saltRounds);
}

export async function verifyPassword(plainText: string, hash: string) {
  return bcrypt.compare(plainText, hash);
}
