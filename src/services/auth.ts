import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { sql } from '@vercel/postgres';
import { User } from '../types';

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createUser(email: string, password: string, name: string): Promise<User> {
  const id = uuidv4();
  const passwordHash = await hashPassword(password);
  const now = new Date().toISOString();

  await sql`
    INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
    VALUES (${id}, ${email.toLowerCase()}, ${passwordHash}, ${name}, ${now}, ${now})
    ON CONFLICT (email) DO NOTHING
  `;

  const { rows } = await sql`SELECT id, email, name, created_at FROM users WHERE email = ${email.toLowerCase()}`;
  const user = rows[0];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at
  };
}

export async function findUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
  const { rows } = await sql`SELECT id, email, name, password_hash, created_at FROM users WHERE email = ${email.toLowerCase()}`;
  if (!rows[0]) return null;

  const user = rows[0];
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    password_hash: user.password_hash,
    createdAt: user.created_at
  };
}

export async function getUserById(id: string): Promise<User | null> {
  const { rows } = await sql`SELECT id, email, name, created_at FROM users WHERE id = ${id}`;
  if (!rows[0]) return null;

  const user = rows[0];
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.created_at
  };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 255;
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.' };
  }
  if (password.length > 128) {
    return { valid: false, error: 'Password must not exceed 128 characters.' };
  }
  return { valid: true };
}

export function validateName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: 'Name is required.' };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters.' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Name must not exceed 100 characters.' };
  }
  return { valid: true };
}
