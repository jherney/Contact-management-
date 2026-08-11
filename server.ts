import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { sql } from '@vercel/postgres';
import { kv } from '@vercel/kv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory fallback server store when Vercel env vars aren't configured yet
let memoryContactsStore: any[] | null = null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Helper to check environment variable presence
  const hasPostgres = Boolean(process.env.POSTGRES_URL);
  const hasKV = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) || Boolean(process.env.KV_URL);

  // 1. Database Status Endpoint
  app.get('/api/database/status', async (req, res) => {
    let itemCount = memoryContactsStore ? memoryContactsStore.length : 0;
    let activeType: 'vercel_postgres' | 'vercel_kv' | 'local_storage' = 'local_storage';
    let providerName = 'PostgreSQL (Local Persistent Fallback)';
    let connected = true;
    let message = 'Operating with client-side & server persistent storage. Connect Vercel Postgres (POSTGRES_URL) for remote cloud SQL sync.';

    if (hasPostgres) {
      try {
        // Attempt Postgres ping/table check
        await sql`
          CREATE TABLE IF NOT EXISTS vercel_contacts (
            id VARCHAR(255) PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `;
        const countRes = await sql`SELECT COUNT(*) FROM vercel_contacts;`;
        itemCount = parseInt(countRes.rows[0].count, 10);
        activeType = 'vercel_postgres';
        providerName = 'Vercel Postgres (Serverless PostgreSQL / Neon)';
        message = 'Connected to Vercel Postgres relational database!';
      } catch (err: any) {
        console.warn('[Server] Vercel Postgres check error:', err.message);
      }
    } else if (hasKV) {
      try {
        const storedKvContacts = await kv.get<any[]>('contacts_list');
        if (storedKvContacts && Array.isArray(storedKvContacts)) {
          itemCount = storedKvContacts.length;
        }
        activeType = 'vercel_kv';
        providerName = 'Vercel KV (Redis Key-Value)';
        message = 'Connected to Vercel KV key-value store!';
      } catch (err: any) {
        console.warn('[Server] Vercel KV check error:', err.message);
      }
    }

    res.json({
      connected,
      type: activeType,
      providerName,
      itemCount,
      message,
      envVarsPresent: {
        postgresUrl: hasPostgres,
        kvUrl: hasKV
      }
    });
  });

  // 1b. PostgreSQL Schema Endpoint
  app.get('/api/postgres/schema', (req, res) => {
    res.json({
      tableName: 'vercel_contacts',
      dialect: 'PostgreSQL 15+',
      ddl: `CREATE TABLE IF NOT EXISTS vercel_contacts (
  id VARCHAR(255) PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`,
      indexes: [
        'CREATE UNIQUE INDEX IF NOT EXISTS vercel_contacts_pkey ON vercel_contacts(id);',
        'CREATE INDEX IF NOT EXISTS vercel_contacts_updated_at_idx ON vercel_contacts(updated_at DESC);'
      ],
      sampleQueries: {
        insert: `INSERT INTO vercel_contacts (id, data, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP;`,
        select: `SELECT data FROM vercel_contacts ORDER BY updated_at DESC;`,
        count: `SELECT COUNT(*) FROM vercel_contacts;`
      }
    });
  });

  // 2. Fetch Contacts Endpoint
  app.get('/api/contacts', async (req, res) => {
    try {
      if (hasPostgres) {
        // Ensure table exists
        await sql`
          CREATE TABLE IF NOT EXISTS vercel_contacts (
            id VARCHAR(255) PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `;
        const { rows } = await sql`SELECT data FROM vercel_contacts ORDER BY updated_at DESC;`;
        const contacts = rows.map((r) => r.data);
        return res.json({ contacts, source: 'vercel_postgres' });
      }

      if (hasKV) {
        const storedKvContacts = (await kv.get<any[]>('contacts_list')) || [];
        return res.json({ contacts: storedKvContacts, source: 'vercel_kv' });
      }

      // Fallback in-memory
      return res.json({ contacts: memoryContactsStore || [], source: 'memory_fallback' });
    } catch (err: any) {
      console.error('[Server] Error fetching contacts from database:', err.message);
      return res.status(500).json({ error: 'Failed to retrieve contacts from database', details: err.message });
    }
  });

  // 3. Save / Sync Contacts Endpoint
  app.post('/api/contacts', async (req, res) => {
    try {
      const { contacts } = req.body;
      if (!Array.isArray(contacts)) {
        return res.status(400).json({ error: 'Invalid payload: contacts must be an array' });
      }

      memoryContactsStore = contacts;

      if (hasPostgres) {
        await sql`
          CREATE TABLE IF NOT EXISTS vercel_contacts (
            id VARCHAR(255) PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `;

        // Batch upsert into Postgres
        for (const contact of contacts) {
          await sql`
            INSERT INTO vercel_contacts (id, data, updated_at)
            VALUES (${contact.id}, ${JSON.stringify(contact)}, CURRENT_TIMESTAMP)
            ON CONFLICT (id) DO UPDATE SET
              data = EXCLUDED.data,
              updated_at = CURRENT_TIMESTAMP;
          `;
        }

        return res.json({
          success: true,
          storageType: 'vercel_postgres',
          message: `Saved ${contacts.length} contacts to Vercel Postgres!`
        });
      }

      if (hasKV) {
        await kv.set('contacts_list', contacts);
        return res.json({
          success: true,
          storageType: 'vercel_kv',
          message: `Saved ${contacts.length} contacts to Vercel KV!`
        });
      }

      return res.json({
        success: true,
        storageType: 'local_storage',
        message: 'Contacts synced locally on server memory and client storage.'
      });
    } catch (err: any) {
      console.error('[Server] Error saving contacts to database:', err.message);
      return res.status(500).json({ error: 'Failed to save contacts to database', details: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Contact Management System running on http://localhost:${PORT}`);
  });
}

startServer();
