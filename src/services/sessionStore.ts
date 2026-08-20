import { kv } from '@vercel/kv';
import { Session, User } from '../types';

const SESSION_PREFIX = 'session:';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function createSession(user: User, userAgent?: string): Promise<Session> {
  const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;
  const session: Session = {
    id: sessionId,
    userId: user.id,
    email: user.email,
    name: user.name,
    createdAt: new Date().toISOString(),
    userAgent
  };

  await kv.setex(`${SESSION_PREFIX}${sessionId}`, SESSION_TTL_SECONDS, JSON.stringify(session));
  return session;
}

export async function getSession(sessionId: string): Promise<Session | null> {
  const raw = await kv.get(`${SESSION_PREFIX}${sessionId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw as string) as Session;
  } catch {
    return null;
  }
}

export async function deleteSession(sessionId: string): Promise<void> {
  await kv.del(`${SESSION_PREFIX}${sessionId}`);
}

export async function refreshSession(sessionId: string): Promise<boolean> {
  const session = await getSession(sessionId);
  if (!session) return false;
  await kv.setex(`${SESSION_PREFIX}${sessionId}`, SESSION_TTL_SECONDS, JSON.stringify(session));
  return true;
}
