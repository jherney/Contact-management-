import { Contact } from '../types';

export interface DatabaseStatus {
  connected: boolean;
  type: 'vercel_postgres' | 'vercel_kv' | 'local_storage';
  providerName: string;
  itemCount: number;
  lastSyncedAt: string | null;
  message: string;
  envVarsPresent: {
    postgresUrl: boolean;
    kvUrl: boolean;
  };
}

const LOCAL_STORAGE_KEY = 'contact_management_system_data_v1';
const DB_LAST_SYNC_KEY = 'cms_db_last_sync_timestamp';

/**
 * Checks backend database connectivity and active Vercel configuration.
 */
export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  const lastSyncedAt = localStorage.getItem(DB_LAST_SYNC_KEY);

  try {
    const res = await fetch('/api/database/status');
    if (res.ok) {
      const data = await res.json();
      return {
        ...data,
        lastSyncedAt: data.lastSyncedAt || lastSyncedAt
      };
    }
  } catch (err) {
    // API endpoint unavailable or offline mode
  }

  // Fallback to local storage persistence mode
  let localCount = 0;
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) localCount = parsed.length;
    }
  } catch (e) {
    // ignore
  }

  return {
    connected: true,
    type: 'local_storage',
    providerName: 'Browser Persistent Storage (Vercel Ready)',
    itemCount: localCount,
    lastSyncedAt,
    message: 'Operating with client-side persistent storage. Connect Vercel Postgres or Vercel KV in your Vercel Dashboard for instant cloud database sync.',
    envVarsPresent: {
      postgresUrl: false,
      kvUrl: false
    }
  };
}

/**
 * Fetches contacts from the server (Vercel Postgres/KV if configured, or falls back to local storage).
 */
export async function fetchRemoteContacts(): Promise<Contact[] | null> {
  try {
    const res = await fetch('/api/contacts');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.contacts)) {
        localStorage.setItem(DB_LAST_SYNC_KEY, new Date().toISOString());
        return data.contacts;
      }
    }
  } catch (e) {
    console.warn('[Vercel DB] Remote fetch skipped or offline:', e);
  }
  return null;
}

/**
 * Saves/Syncs all contacts to the Vercel database endpoint.
 */
export async function saveContactsToDatabase(contacts: Contact[]): Promise<{ success: boolean; message: string; mode: string }> {
  const now = new Date().toISOString();
  
  // Always update local storage first as a guaranteed backup
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(contacts));
    localStorage.setItem(DB_LAST_SYNC_KEY, now);
  } catch (e) {
    console.error('[Vercel DB] Failed to write to localStorage:', e);
  }

  try {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts })
    });

    if (res.ok) {
      const result = await res.json();
      return {
        success: true,
        message: result.message || 'Contacts successfully saved to Vercel Database!',
        mode: result.storageType || 'server'
      };
    }
  } catch (e) {
    // Fail gracefully back to local storage
  }

  return {
    success: true,
    message: 'Contacts persisted locally. Connect Vercel Postgres or Vercel KV for cloud database syncing.',
    mode: 'local_storage'
  };
}
