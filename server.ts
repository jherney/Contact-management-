import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { Pool } from 'pg';
import { kv } from '@vercel/kv';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';

let dbPool: Pool | null = null;

function getPool(): Pool {
  if (!dbPool) {
    dbPool = new Pool({
      connectionString: process.env.POSTGRES_URL,
    });
  }
  return dbPool;
}

function sql(strings: TemplateStringsArray, ...values: any[]): Promise<any> {
  const pool = getPool();
  let query = strings[0];
  for (let i = 0; i < values.length; i++) {
    query += '$' + (i + 1) + strings[i + 1];
  }
  return pool.query(query, values);
}

declare module 'express' {
  interface Request {
    user?: {
      id: string;
      userId: string;
      email: string;
      name: string;
      createdAt: string;
      userAgent?: string;
    };
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory fallback server store when Vercel env vars aren't configured yet
let memoryContactsStore: any[] | null = null;
let memoryCompaniesStore: any[] = [];
let memoryDealStore: any[] = [];
let memoryTaskStore: any[] = [];
let memoryReminderStore: any[] = [];

const SESSION_COOKIE_NAME = 'session_id';
const CSRF_COOKIE_NAME = 'csrf_token';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSessionCookieOptions(secure: boolean): express.CookieOptions {
  return {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: '/'
  };
}

function getCsrfCookieOptions(secure: boolean): express.CookieOptions {
  return {
    httpOnly: false,
    secure,
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: '/'
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProduction = process.env.NODE_ENV === 'production';
  const isSecure = isProduction;

  app.use(express.json({ limit: '10mb' }));
  app.use(cookieParser());

  // CSRF protection
  const csrfMiddleware = csrf({ cookie: getCsrfCookieOptions(isSecure) });
  app.use(csrfMiddleware);

  // Helper to check environment variable presence
  const hasPostgres = Boolean(process.env.POSTGRES_URL);
  const hasKV = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) || Boolean(process.env.KV_URL);

  // Session helpers
  async function getSessionFromRequest(req: express.Request): Promise<any | null> {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    if (!sessionId) return null;
    const raw = await kv.get(`session:${sessionId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw as string);
    } catch {
      return null;
    }
  }

  // Auth middleware
  async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      req.user = session;
      next();
    } catch (err: any) {
      console.error('[Auth] requireAuth error:', err.message);
      return res.status(401).json({ error: 'Authentication required' });
    }
  }

   // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // 1. Database Status Endpoint
  app.get('/api/database/status', async (req, res) => {
    let itemCount = memoryContactsStore ? memoryContactsStore.length : 0;
    let activeType: 'vercel_postgres' | 'vercel_kv' | 'local_storage' = 'local_storage';
    let providerName = 'PostgreSQL (Local Persistent Fallback)';
    let connected = true;
    let message = 'Operating with client-side & server persistent storage. Connect Vercel Postgres (POSTGRES_URL) for remote cloud SQL sync.';

    if (hasPostgres) {
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS vercel_contacts (
            id VARCHAR(255) PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `;
        await sql`
          CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
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

  // 2. Auth Routes

  // Get CSRF token
  app.get('/api/auth/csrf', (req, res) => {
    res.json({ csrfToken: (req as any).csrfToken() });
  });

  // Register
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password || !name) {
        return res.status(400).json({ error: 'Email, password, and name are required.' });
      }

      const trimmedEmail = email.trim().toLowerCase();
      const trimmedName = name.trim();

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      }

      if (trimmedName.length < 2 || trimmedName.length > 100) {
        return res.status(400).json({ error: 'Name must be between 2 and 100 characters.' });
      }

      if (!hasPostgres) {
        return res.status(500).json({ error: 'Database not configured. Please set up Vercel Postgres to enable authentication.' });
      }

      // Check if user exists
      const { rows: existingRows } = await sql`SELECT id FROM users WHERE email = ${trimmedEmail}`;
      if (existingRows.length > 0) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const id = uuidv4();
      const passwordHash = await bcrypt.hash(password, 12);
      const now = new Date().toISOString();

      await sql`
        INSERT INTO users (id, email, password_hash, name, created_at, updated_at)
        VALUES (${id}, ${trimmedEmail}, ${passwordHash}, ${trimmedName}, ${now}, ${now})
      `;

      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;
      const session = {
        id: sessionId,
        userId: id,
        email: trimmedEmail,
        name: trimmedName,
        createdAt: now,
        userAgent: req.headers['user-agent']
      };

      await kv.setex(`session:${sessionId}`, SESSION_TTL_SECONDS, JSON.stringify(session));
      res.cookie(SESSION_COOKIE_NAME, sessionId, getSessionCookieOptions(isSecure));

      return res.status(201).json({ user: { id, email: trimmedEmail, name: trimmedName }, session });
    } catch (err: any) {
      console.error('[Auth] Register error:', err.message);
      return res.status(500).json({ error: 'Failed to create account. Please try again.' });
    }
  });

  // Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      if (!hasPostgres) {
        return res.status(500).json({ error: 'Database not configured. Please set up Vercel Postgres to enable authentication.' });
      }

      const trimmedEmail = email.trim().toLowerCase();
      const { rows } = await sql`SELECT id, email, name, password_hash, created_at FROM users WHERE email = ${trimmedEmail}`;
      const userRow = rows[0];

      if (!userRow) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const valid = await bcrypt.compare(password, userRow.password_hash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;
      const session = {
        id: sessionId,
        userId: userRow.id,
        email: userRow.email,
        name: userRow.name,
        createdAt: new Date().toISOString(),
        userAgent: req.headers['user-agent']
      };

      await kv.setex(`session:${sessionId}`, SESSION_TTL_SECONDS, JSON.stringify(session));
      res.cookie(SESSION_COOKIE_NAME, sessionId, getSessionCookieOptions(isSecure));

      return res.json({
        user: { id: userRow.id, email: userRow.email, name: userRow.name },
        session
      });
    } catch (err: any) {
      console.error('[Auth] Login error:', err.message);
      return res.status(500).json({ error: 'Failed to log in. Please try again.' });
    }
  });

  // Logout
  app.post('/api/auth/logout', async (req, res) => {
    try {
      const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
      if (sessionId) {
        await kv.del(`session:${sessionId}`);
      }
      res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
      return res.json({ success: true });
    } catch (err: any) {
      console.error('[Auth] Logout error:', err.message);
      return res.status(500).json({ error: 'Failed to log out.' });
    }
  });

  // Get current user
  app.get('/api/auth/me', async (req, res) => {
    try {
      const session = await getSessionFromRequest(req);
      if (!session) {
        return res.status(401).json({ error: 'Not authenticated' });
      }
      return res.json({ user: { id: session.userId, email: session.email, name: session.name } });
    } catch (err: any) {
      console.error('[Auth] Me error:', err.message);
      return res.status(401).json({ error: 'Not authenticated' });
    }
  });

  // 3. Fetch Contacts Endpoint (protected)
  app.get('/api/contacts', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;

      if (hasPostgres) {
        await sql`
          CREATE TABLE IF NOT EXISTS vercel_contacts (
            id VARCHAR(255) PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `;
        const { rows } = await sql`
          SELECT data FROM vercel_contacts 
          WHERE data->>'userId' = ${userId} OR data->>'user_id' = ${userId}
          ORDER BY updated_at DESC
        `;
        const contacts = rows.map((r) => r.data);
        return res.json({ contacts, source: 'vercel_postgres' });
      }

      if (hasKV) {
        const storedKvContacts = (await kv.get<any[]>('contacts_list')) || [];
        const userContacts = storedKvContacts.filter((c: any) => c.userId === userId || c.user_id === userId);
        return res.json({ contacts: userContacts, source: 'vercel_kv' });
      }

      // Fallback in-memory
      const allMemory = memoryContactsStore || [];
      const userContacts = allMemory.filter((c: any) => c.userId === userId || c.user_id === userId);
      return res.json({ contacts: userContacts, source: 'memory_fallback' });
    } catch (err: any) {
      console.error('[Server] Error fetching contacts:', err.message);
      return res.status(500).json({ error: 'Failed to retrieve contacts', details: err.message });
    }
  });

  // 4. Save / Sync Contacts Endpoint (protected)
  app.post('/api/contacts', requireAuth, async (req: any, res) => {
    try {
      const { contacts } = req.body;
      if (!Array.isArray(contacts)) {
        return res.status(400).json({ error: 'Invalid payload: contacts must be an array' });
      }

      const userId = req.user.userId;
      const userContacts = contacts.map((c: any) => ({
        ...c,
        userId: c.userId || c.user_id || userId,
        user_id: c.userId || c.user_id || userId
      }));

      memoryContactsStore = userContacts;

      if (hasPostgres) {
        await sql`
          CREATE TABLE IF NOT EXISTS vercel_contacts (
            id VARCHAR(255) PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `;

        for (const contact of userContacts) {
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
          message: `Saved ${userContacts.length} contacts to Vercel Postgres!`
        });
      }

      if (hasKV) {
        await kv.set('contacts_list', userContacts);
        return res.json({
          success: true,
          storageType: 'vercel_kv',
          message: `Saved ${userContacts.length} contacts to Vercel KV!`
        });
      }

      return res.json({
        success: true,
        storageType: 'local_storage',
        message: 'Contacts synced locally on server memory and client storage.'
      });
    } catch (err: any) {
      console.error('[Server] Error saving contacts:', err.message);
      return res.status(500).json({ error: 'Failed to save contacts', details: err.message });
    }
  });

  // 5. Delete single contact (protected)
  app.delete('/api/contacts/:id', requireAuth, async (req: any, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      if (hasPostgres) {
        const { rowCount } = await sql`
          DELETE FROM vercel_contacts 
          WHERE id = ${id} AND (data->>'userId' = ${userId} OR data->>'user_id' = ${userId})
        `;
        if (rowCount === 0) {
          return res.status(404).json({ error: 'Contact not found or access denied' });
        }
        return res.json({ success: true });
      }

      if (hasKV) {
        const stored = (await kv.get<any[]>('contacts_list')) || [];
        const filtered = stored.filter((c: any) => !(c.id === id && (c.userId === userId || c.user_id === userId)));
        await kv.set('contacts_list', filtered);
        return res.json({ success: true });
      }

      if (memoryContactsStore) {
        const initialLen = memoryContactsStore.length;
        memoryContactsStore = memoryContactsStore.filter((c: any) => !(c.id === id && (c.userId === userId || c.user_id === userId)));
        if (memoryContactsStore.length === initialLen) {
          return res.status(404).json({ error: 'Contact not found or access denied' });
        }
      }

      return res.json({ success: true });
    } catch (err: any) {
      console.error('[Server] Error deleting contact:', err.message);
      return res.status(500).json({ error: 'Failed to delete contact', details: err.message });
    }
  });

  // 6. User contacts count
  app.get('/api/contacts/count', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;

      if (hasPostgres) {
        await sql`
          CREATE TABLE IF NOT EXISTS vercel_contacts (
            id VARCHAR(255) PRIMARY KEY,
            data JSONB NOT NULL,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `;
        const countRes = await sql`SELECT COUNT(*) FROM vercel_contacts WHERE data->>'userId' = ${userId} OR data->>'user_id' = ${userId}`;
        return res.json({ count: parseInt(countRes.rows[0].count, 10) });
      }

      if (hasKV) {
        const stored = (await kv.get<any[]>('contacts_list')) || [];
        const count = stored.filter((c: any) => c.userId === userId || c.user_id === userId).length;
        return res.json({ count });
      }

      const allMemory = memoryContactsStore || [];
      const count = allMemory.filter((c: any) => c.userId === userId || c.user_id === userId).length;
      return res.json({ count });
    } catch (err: any) {
      console.error('[Server] Error counting contacts:', err.message);
      return res.status(500).json({ error: 'Failed to count contacts', details: err.message });
    }
  });

  // ============================================================
  // Phase 2: Companies
  // ============================================================
  app.get('/api/companies', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      if (hasPostgres) {
        await sql`
          CREATE TABLE IF NOT EXISTS companies (
            id VARCHAR(255) PRIMARY KEY,
            user_id UUID NOT NULL,
            name VARCHAR(200) NOT NULL,
            industry VARCHAR(100),
            size VARCHAR(50),
            website VARCHAR(200),
            address TEXT,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `;
        const { rows } = await sql`SELECT * FROM companies WHERE user_id = ${userId} ORDER BY name ASC`;
        return res.json({ companies: rows });
      }
      return res.json({ companies: memoryCompaniesStore.filter((c: any) => c.userId === userId) });
    } catch (err: any) {
      console.error('[Server] Error fetching companies:', err.message);
      return res.status(500).json({ error: 'Failed to fetch companies', details: err.message });
    }
  });

  app.post('/api/companies', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { name, industry, size, website, address, notes } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Company name is required.' });
      }
      const id = uuidv4();
      const now = new Date().toISOString();
      const company = {
        id,
        userId,
        name: name.trim(),
        industry: industry || undefined,
        size: size || undefined,
        website: website || undefined,
        address: address || undefined,
        notes: notes || undefined,
        createdAt: now,
        updatedAt: now,
      };

      if (hasPostgres) {
        await sql`
          CREATE TABLE IF NOT EXISTS companies (
            id VARCHAR(255) PRIMARY KEY,
            user_id UUID NOT NULL,
            name VARCHAR(200),
            industry VARCHAR(100),
            size VARCHAR(50),
            website VARCHAR(200),
            address TEXT,
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `;
        await sql`
          INSERT INTO companies (id, user_id, name, industry, size, website, address, notes, created_at, updated_at)
          VALUES (${id}, ${userId}, ${company.name}, ${company.industry || null}, ${company.size || null}, ${company.website || null}, ${company.address || null}, ${company.notes || null}, ${now}, ${now})
        `;
      }
      memoryCompaniesStore.push(company);
      return res.status(201).json({ company });
    } catch (err: any) {
      console.error('[Server] Error creating company:', err.message);
      return res.status(500).json({ error: 'Failed to create company', details: err.message });
    }
  });

  app.put('/api/companies/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { name, industry, size, website, address, notes } = req.body;

      if (hasPostgres) {
        const result = await sql`
          UPDATE companies SET
            name = ${name?.trim() || null},
            industry = ${industry || null},
            size = ${size || null},
            website = ${website || null},
            address = ${address || null},
            notes = ${notes || null},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id} AND user_id = ${userId}
        `;
        if (result.rowCount === 0) return res.status(404).json({ error: 'Company not found or access denied' });
      }

      const idx = memoryCompaniesStore.findIndex((c: any) => c.id === id && c.userId === userId);
      if (idx === -1) return res.status(404).json({ error: 'Company not found or access denied' });
      memoryCompaniesStore[idx] = {
        ...memoryCompaniesStore[idx],
        name: name?.trim() || memoryCompaniesStore[idx].name,
        industry: industry || undefined,
        size: size || undefined,
        website: website || undefined,
        address: address || undefined,
        notes: notes || undefined,
        updatedAt: new Date().toISOString(),
      };
      return res.json({ company: memoryCompaniesStore[idx] });
    } catch (err: any) {
      console.error('[Server] Error updating company:', err.message);
      return res.status(500).json({ error: 'Failed to update company', details: err.message });
    }
  });

  app.delete('/api/companies/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      if (hasPostgres) {
        const result = await sql`UPDATE deals SET contact_id = NULL WHERE contact_id = ${id} AND user_id = ${userId}`;
        const del = await sql`DELETE FROM companies WHERE id = ${id} AND user_id = ${userId}`;
        if (del.rowCount === 0) return res.status(404).json({ error: 'Company not found or access denied' });
      }

      const initialLen = memoryCompaniesStore.length;
      memoryCompaniesStore = memoryCompaniesStore.filter((c: any) => !(c.id === id && c.userId === userId));
      if (memoryCompaniesStore.length === initialLen) return res.status(404).json({ error: 'Company not found or access denied' });
      return res.json({ success: true });
    } catch (err: any) {
      console.error('[Server] Error deleting company:', err.message);
      return res.status(500).json({ error: 'Failed to delete company', details: err.message });
    }
  });

  // ============================================================
  // Phase 2: Deals
  // ============================================================
  app.get('/api/deals', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      if (hasPostgres) {
        await sql`
          CREATE TABLE IF NOT EXISTS deals (
            id VARCHAR(255) PRIMARY KEY,
            user_id UUID NOT NULL,
            title VARCHAR(255),
            value NUMERIC(12,2),
            stage VARCHAR(20),
            probability INTEGER,
            expected_close_date DATE,
            notes TEXT,
            contact_id VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `;
        const { rows } = await sql`SELECT * FROM deals WHERE user_id = ${userId} ORDER BY created_at DESC`;
        return res.json({ deals: rows });
      }
      return res.json({ deals: memoryDealStore.filter((d: any) => d.userId === userId) });
    } catch (err: any) {
      console.error('[Server] Error fetching deals:', err.message);
      return res.status(500).json({ error: 'Failed to fetch deals', details: err.message });
    }
  });

  app.post('/api/deals', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { title, value, stage, probability, expectedCloseDate, notes, contactId } = req.body;
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Deal title is required.' });
      }
      const id = uuidv4();
      const now = new Date().toISOString();
      const deal = {
        id,
        userId,
        title: title.trim(),
        value: value || 0,
        stage: stage || 'lead',
        probability: probability || 50,
        expectedCloseDate: expectedCloseDate || undefined,
        notes: notes || undefined,
        contactId: contactId || undefined,
        createdAt: now,
        updatedAt: now,
      };
      if (hasPostgres) {
        await sql`
          INSERT INTO deals (id, user_id, title, value, stage, probability, expected_close_date, notes, contact_id, created_at, updated_at)
          VALUES (${id}, ${userId}, ${deal.title}, ${deal.value}, ${deal.stage}, ${deal.probability}, ${deal.expectedCloseDate || null}, ${deal.notes || null}, ${deal.contactId || null}, ${now}, ${now})
        `;
      }
      memoryDealStore.push(deal);
      return res.status(201).json({ deal });
    } catch (err: any) {
      console.error('[Server] Error creating deal:', err.message);
      return res.status(500).json({ error: 'Failed to create deal', details: err.message });
    }
  });

  app.put('/api/deals/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { title, value, stage, probability, expectedCloseDate, notes, contactId } = req.body;

      if (hasPostgres) {
        const result = await sql`
          UPDATE deals SET
            title = ${title?.trim() || null},
            value = ${value || 0},
            stage = ${stage || 'lead'},
            probability = ${probability || 50},
            expected_close_date = ${expectedCloseDate || null},
            notes = ${notes || null},
            contact_id = ${contactId || null},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id} AND user_id = ${userId}
        `;
        if (result.rowCount === 0) return res.status(404).json({ error: 'Deal not found or access denied' });
      }

      const idx = memoryDealStore.findIndex((d: any) => d.id === id && d.userId === userId);
      if (idx === -1) return res.status(404).json({ error: 'Deal not found or access denied' });
      memoryDealStore[idx] = { ...memoryDealStore[idx], ...req.body };
      return res.json({ deal: memoryDealStore[idx] });
    } catch (err: any) {
      console.error('[Server] Error updating deal:', err.message);
      return res.status(500).json({ error: 'Failed to update deal', details: err.message });
    }
  });

  app.delete('/api/deals/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      if (hasPostgres) {
        const result = await sql`UPDATE tasks SET deal_id = NULL WHERE deal_id = ${id} AND user_id = ${userId}`;
        const del = await sql`DELETE FROM deals WHERE id = ${id} AND user_id = ${userId}`;
        if (del.rowCount === 0) return res.status(404).json({ error: 'Deal not found or access denied' });
      }

      const initialLen = memoryDealStore.length;
      memoryDealStore = memoryDealStore.filter((d: any) => !(d.id === id && d.userId === userId));
      if (memoryDealStore.length === initialLen) return res.status(404).json({ error: 'Deal not found or access denied' });
      return res.json({ success: true });
    } catch (err: any) {
      console.error('[Server] Error deleting deal:', err.message);
      return res.status(500).json({ error: 'Failed to delete deal', details: err.message });
    }
  });

  // ============================================================
  // Phase 2: Tasks
  // ============================================================
  app.get('/api/tasks', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      if (hasPostgres) {
        await sql`
          CREATE TABLE IF NOT EXISTS tasks (
            id VARCHAR(255) PRIMARY KEY,
            user_id UUID NOT NULL,
            title VARCHAR(255),
            description TEXT,
            due_date TIMESTAMP WITH TIME ZONE,
            completed_at TIMESTAMP WITH TIME ZONE,
            status VARCHAR(20),
            priority VARCHAR(10),
            contact_id VARCHAR(255),
            deal_id VARCHAR(255),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `;
        const { rows } = await sql`SELECT * FROM tasks WHERE user_id = ${userId} ORDER BY due_date ASC NULLS LAST, created_at DESC`;
        return res.json({ tasks: rows });
      }
      return res.json({ tasks: memoryTaskStore.filter((t: any) => t.userId === userId) });
    } catch (err: any) {
      console.error('[Server] Error fetching tasks:', err.message);
      return res.status(500).json({ error: 'Failed to fetch tasks', details: err.message });
    }
  });

  app.post('/api/tasks', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { title, description, dueDate, status, priority, contactId, dealId } = req.body;
      if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Task title is required.' });
      }
      const id = uuidv4();
      const now = new Date().toISOString();
      const task = {
        id,
        userId,
        title: title.trim(),
        description: description || undefined,
        dueDate: dueDate || undefined,
        status: status || 'pending',
        priority: priority || 'medium',
        contactId: contactId || undefined,
        dealId: dealId || undefined,
        createdAt: now,
        updatedAt: now,
      };
      if (hasPostgres) {
        await sql`
          INSERT INTO tasks (id, user_id, title, description, due_date, status, priority, contact_id, deal_id, created_at, updated_at)
          VALUES (${id}, ${userId}, ${task.title}, ${task.description || null}, ${task.dueDate || null}, ${task.status}, ${task.priority}, ${task.contactId || null}, ${task.dealId || null}, ${now}, ${now})
        `;
      }
      memoryTaskStore.push(task);
      return res.status(201).json({ task });
    } catch (err: any) {
      console.error('[Server] Error creating task:', err.message);
      return res.status(500).json({ error: 'Failed to create task', details: err.message });
    }
  });

  app.put('/api/tasks/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { title, description, dueDate, status, priority, contactId, dealId, completedAt } = req.body;

      if (hasPostgres) {
        const result = await sql`
          UPDATE tasks SET
            title = ${title?.trim() || null},
            description = ${description || null},
            due_date = ${dueDate || null},
            status = ${status || 'pending'},
            priority = ${priority || 'medium'},
            contact_id = ${contactId || null},
            deal_id = ${dealId || null},
            completed_at = ${completedAt || null},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id} AND user_id = ${userId}
        `;
        if (result.rowCount === 0) return res.status(404).json({ error: 'Task not found or access denied' });
      }

      const idx = memoryTaskStore.findIndex((t: any) => t.id === id && t.userId === userId);
      if (idx === -1) return res.status(404).json({ error: 'Task not found or access denied' });
      memoryTaskStore[idx] = { ...memoryTaskStore[idx], ...req.body, updatedAt: new Date().toISOString() };
      return res.json({ task: memoryTaskStore[idx] });
    } catch (err: any) {
      console.error('[Server] Error updating task:', err.message);
      return res.status(500).json({ error: 'Failed to update task', details: err.message });
    }
  });

  app.delete('/api/tasks/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      if (hasPostgres) {
        const result = await sql`DELETE FROM tasks WHERE id = ${id} AND user_id = ${userId}`;
        if (result.rowCount === 0) return res.status(404).json({ error: 'Task not found or access denied' });
      }

      const initialLen = memoryTaskStore.length;
      memoryTaskStore = memoryTaskStore.filter((t: any) => !(t.id === id && t.userId === userId));
      if (memoryTaskStore.length === initialLen) return res.status(404).json({ error: 'Task not found or access denied' });
      return res.json({ success: true });
    } catch (err: any) {
      console.error('[Server] Error deleting task:', err.message);
      return res.status(500).json({ error: 'Failed to delete task', details: err.message });
    }
  });

  // ============================================================
  // Phase 2: Reminders
  // ============================================================
  app.get('/api/reminders', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      if (hasPostgres) {
        await sql`
          CREATE TABLE IF NOT EXISTS reminders (
            id VARCHAR(255) PRIMARY KEY,
            user_id UUID NOT NULL,
            contact_id VARCHAR(255),
            deal_id VARCHAR(255),
            type VARCHAR(20),
            title VARCHAR(255),
            message TEXT,
            remind_at TIMESTAMP WITH TIME ZONE,
            recurrence VARCHAR(10),
            status VARCHAR(15),
            snoozed_until TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          );
        `;
        const { rows } = await sql`SELECT * FROM reminders WHERE user_id = ${userId} AND status = 'active' ORDER BY remind_at ASC`;
        return res.json({ reminders: rows });
      }
      return res.json({ reminders: memoryReminderStore.filter((r: any) => r.userId === userId && r.status === 'active') });
    } catch (err: any) {
      console.error('[Server] Error fetching reminders:', err.message);
      return res.status(500).json({ error: 'Failed to fetch reminders', details: err.message });
    }
  });

  app.post('/api/reminders', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { contactId, dealId, type, title, message, remindAt, recurrence } = req.body;
      if (!title || !remindAt) {
        return res.status(400).json({ error: 'Title and reminder time are required.' });
      }
      const id = uuidv4();
      const now = new Date().toISOString();
      const reminder = {
        id,
        userId,
        contactId: contactId || undefined,
        dealId: dealId || undefined,
        type: type || 'custom',
        title: title.trim(),
        message: message || undefined,
        remindAt,
        recurrence: recurrence || 'none',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      };
      if (hasPostgres) {
        await sql`
          INSERT INTO reminders (id, user_id, contact_id, deal_id, type, title, message, remind_at, recurrence, status, created_at, updated_at)
          VALUES (${id}, ${userId}, ${reminder.contactId || null}, ${reminder.dealId || null}, ${reminder.type}, ${reminder.title}, ${reminder.message || null}, ${reminder.remindAt}, ${reminder.recurrence}, ${reminder.status}, ${now}, ${now})
        `;
      }
      memoryReminderStore.push(reminder);
      return res.status(201).json({ reminder });
    } catch (err: any) {
      console.error('[Server] Error creating reminder:', err.message);
      return res.status(500).json({ error: 'Failed to create reminder', details: err.message });
    }
  });

  app.put('/api/reminders/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { id } = req.params;
      const { title, message, remindAt, recurrence, status, snoozedUntil } = req.body;

      if (hasPostgres) {
        const result = await sql`
          UPDATE reminders SET
            title = ${title || null},
            message = ${message || null},
            remind_at = ${remindAt || null},
            recurrence = ${recurrence || null},
            status = ${status || null},
            snoozed_until = ${snoozedUntil || null},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${id} AND user_id = ${userId}
        `;
        if (result.rowCount === 0) return res.status(404).json({ error: 'Reminder not found or access denied' });
      }

      const idx = memoryReminderStore.findIndex((r: any) => r.id === id && r.userId === userId);
      if (idx === -1) return res.status(404).json({ error: 'Reminder not found or access denied' });
      memoryReminderStore[idx] = { ...memoryReminderStore[idx], ...req.body, updatedAt: new Date().toISOString() };
      return res.json({ reminder: memoryReminderStore[idx] });
    } catch (err: any) {
      console.error('[Server] Error updating reminder:', err.message);
      return res.status(500).json({ error: 'Failed to update reminder', details: err.message });
    }
  });

  app.delete('/api/reminders/:id', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const { id } = req.params;

      if (hasPostgres) {
        const result = await sql`DELETE FROM reminders WHERE id = ${id} AND user_id = ${userId}`;
        if (result.rowCount === 0) return res.status(404).json({ error: 'Reminder not found or access denied' });
      }

      const initialLen = memoryReminderStore.length;
      memoryReminderStore = memoryReminderStore.filter((r: any) => !(r.id === id && r.userId === userId));
      if (memoryReminderStore.length === initialLen) return res.status(404).json({ error: 'Reminder not found or access denied' });
      return res.json({ success: true });
    } catch (err: any) {
      console.error('[Server] Error deleting reminder:', err.message);
      return res.status(500).json({ error: 'Failed to delete reminder', details: err.message });
    }
  });

  // 7. Get due reminders (for notification center)
  app.get('/api/reminders/due', requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const now = new Date().toISOString();

      if (hasPostgres) {
        const { rows } = await sql`
          SELECT * FROM reminders 
          WHERE user_id = ${userId} 
            AND status = 'active' 
            AND remind_at <= ${now}
            AND (snoozed_until IS NULL OR snoozed_until <= ${now})
          ORDER BY remind_at ASC
        `;
        return res.json({ reminders: rows });
      }

      const due = memoryReminderStore
        .filter((r: any) => r.userId === userId && r.status === 'active' && r.remindAt <= now && (!r.snoozedUntil || r.snoozedUntil <= now))
        .sort((a: any, b: any) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime());
      return res.json({ reminders: due });
    } catch (err: any) {
      console.error('[Server] Error fetching due reminders:', err.message);
      return res.status(500).json({ error: 'Failed to fetch reminders', details: err.message });
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

  // Seed database with sample data if empty
  if (hasPostgres) {
    try {
      await seedDatabase();
    } catch (err: any) {
      console.warn('[Seed] Initial seed error:', err.message);
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Contact Management System running on http://localhost:${PORT}`);
  });
}

async function seedDatabase() {
  const contactsRes = await sql`SELECT COUNT(*) FROM vercel_contacts;`;
  const contactsCount = parseInt(contactsRes.rows[0].count, 10);
  if (contactsCount > 0) {
    console.log('[Seed] Database already has data, skipping seed');
    return;
  }

  const usersRes = await sql`SELECT COUNT(*) FROM users;`;
  const usersCount = parseInt(usersRes.rows[0].count, 10);

  const userId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

  if (usersCount === 0) {
    const passwordHash = await bcrypt.hash('adminpass123', 12);
    await sql`
      INSERT INTO users (id, email, password_hash, name)
      VALUES (${userId}, 'admin@contactmgmt.com', ${passwordHash}, 'Admin User')
    `;
    console.log('[Seed] Created sample user: admin@contactmgmt.com / adminpass123');
  }

  const sampleContacts = [
    {
      id: 'contact-001',
      userId,
      firstName: 'Sarah',
      lastName: 'Chen',
      email: 'sarah.chen@acme-corp.com',
      phone: '+1 (555) 123-4567',
      company: 'Acme Corp',
      jobTitle: 'CTO',
      category: 'Work',
      tags: ['VIP', 'Decision'],
      avatarBgColor: 'bg-[#3b82f6]',
      isFavorite: true,
      address: '123 Tech St, San Francisco, CA',
      linkedIn: 'linkedin.com/in/sarahchen',
      notes: 'Key decision maker for enterprise software deals. Prefers technical demos over sales pitches.',
      interactions: [
        { id: 'i1', type: 'Meeting', date: '2025-07-15T10:00:00Z', summary: 'Product demo and Q&A session', details: 'Sarah was very engaged, asked detailed questions about integration capabilities.' },
        { id: 'i2', type: 'Email', date: '2025-07-20T14:30:00Z', summary: 'Follow-up email with pricing', details: 'Sent pricing options and implementation timeline.' },
        { id: 'i3', type: 'Call', date: '2025-07-28T09:00:00Z', summary: 'Call to discuss contract terms', details: 'Discussed custom SLA and support package options.' }
      ],
      createdAt: '2025-06-01T08:00:00Z',
      updatedAt: '2025-07-28T09:00:00Z',
      lastContactedAt: '2025-07-28T09:00:00Z'
    },
    {
      id: 'contact-002',
      userId,
      firstName: 'Marcus',
      lastName: 'Rodriguez',
      email: 'marcus@startuptech.io',
      phone: '+1 (555) 234-5678',
      company: 'StartupTech',
      jobTitle: 'Co-founder & CEO',
      category: 'Client',
      tags: ['Investor', 'Key Client'],
      avatarBgColor: 'bg-[#10b981]',
      isFavorite: true,
      address: '456 Market St, San Francisco, CA',
      linkedIn: 'linkedin.com/in/marcusrodriguez',
      notes: 'Early-stage startup founder. Looking for scalable solutions. Series A funding recently closed.',
      interactions: [
        { id: 'i1', type: 'Call', date: '2025-07-10T11:00:00Z', summary: 'Initial discovery call', details: 'Discussed pain points with current CRM solution and requirements.' },
        { id: 'i2', type: 'Meeting', date: '2025-07-18T15:00:00Z', summary: 'Product walkthrough', details: 'Walked through platform features. Showed particular interest in automation.' }
      ],
      createdAt: '2025-06-15T10:00:00Z',
      updatedAt: '2025-07-18T15:00:00Z',
      lastContactedAt: '2025-07-18T15:00:00Z'
    },
    {
      id: 'contact-003',
      userId,
      firstName: 'Priya',
      lastName: 'Sharma',
      email: 'priya.sharma@global-enterprises.com',
      phone: '+1 (555) 345-6789',
      company: 'Global Enterprises',
      jobTitle: 'VP of Sales',
      category: 'Work',
      tags: ['Enterprise', 'Board'],
      avatarBgColor: 'bg-[#f43f5e]',
      isFavorite: false,
      address: '789 Corporate Ave, New York, NY',
      linkedIn: 'linkedin.com/in/priyasharma',
      notes: 'Large enterprise with complex procurement process. Needs multi-region support and compliance.',
      interactions: [
        { id: 'i1', type: 'Email', date: '2025-06-25T09:30:00Z', summary: 'Initial outreach', details: 'Reached out regarding enterprise solution for lead management.' },
        { id: 'i2', type: 'Follow-up', date: '2025-07-05T13:00:00Z', summary: 'Follow-up on enterprise proposal', details: 'Sent detailed proposal and pricing for enterprise plan.' },
        { id: 'i3', type: 'Meeting', date: '2025-07-22T14:00:00Z', summary: 'Enterprise demo with technical team', details: 'Demoed platform to technical team including security and compliance features.' }
      ],
      createdAt: '2025-06-20T09:00:00Z',
      updatedAt: '2025-07-22T14:00:00Z',
      lastContactedAt: '2025-07-22T14:00:00Z'
    },
    {
      id: 'contact-004',
      userId,
      firstName: 'James',
      lastName: 'Wilson',
      email: 'james.wilson@tech-solutions.co',
      phone: '+1 (555) 456-7890',
      company: 'Tech Solutions Inc',
      jobTitle: 'IT Director',
      category: 'Work',
      tags: ['Technical'],
      avatarBgColor: 'bg-[#8b5cf6]',
      isFavorite: false,
      address: '321 Oak St, Austin, TX',
      linkedIn: 'linkedin.com/in/jameswilson',
      notes: 'Technical buyer. Interested in integration capabilities and API documentation.',
      interactions: [
        { id: 'i1', type: 'Call', date: '2025-06-30T16:00:00Z', summary: 'Intro call with IT team', details: 'Discussed integration requirements and API needs.' }
      ],
      createdAt: '2025-06-28T12:00:00Z',
      updatedAt: '2025-06-30T16:00:00Z',
      lastContactedAt: '2025-06-30T16:00:00Z'
    },
    {
      id: 'contact-005',
      userId,
      firstName: 'Emma',
      lastName: 'Thompson',
      email: 'emma.thompson@designs-r-us.com',
      phone: '+1 (555) 567-8901',
      company: 'Designs R Us',
      jobTitle: 'Creative Director',
      category: 'Client',
      tags: ['VIP'],
      avatarBgColor: 'bg-[#ff4d00]',
      isFavorite: true,
      address: '654 Pine St, Portland, OR',
      linkedIn: 'linkedin.com/in/emmathompson',
      notes: 'Long-time client, renewal due next month. Very satisfied with current solution.',
      interactions: [
        { id: 'i1', type: 'Email', date: '2025-07-01T10:00:00Z', summary: 'Renewal check-in', details: 'Reached out regarding contract renewal.' },
        { id: 'i2', type: 'Meeting', date: '2025-07-12T11:00:00Z', summary: 'Renewal discussion', details: 'Discussed renewal terms and requested additional features.' }
      ],
      createdAt: '2025-05-10T08:00:00Z',
      updatedAt: '2025-07-12T11:00:00Z',
      lastContactedAt: '2025-07-12T11:00:00Z'
    },
    {
      id: 'contact-006',
      userId,
      firstName: 'David',
      lastName: 'Kim',
      email: 'david.kim@venture-cap.com',
      phone: '+1 (555) 678-9012',
      company: 'Venture Capital Partners',
      jobTitle: 'Partner',
      category: 'Investor',
      tags: ['Investor', 'Board'],
      avatarBgColor: 'bg-[#eab308]',
      isFavorite: false,
      address: '987 Wall St, San Francisco, CA',
      linkedIn: 'linkedin.com/in/davidkim',
      notes: 'Investor in the company. Interested in product roadmap and upcoming features.',
      interactions: [
        { id: 'i1', type: 'Note', date: '2025-06-15T00:00:00Z', summary: 'Investor check-in note', details: 'Quick note about upcoming board meeting agenda.' },
        { id: 'i2', type: 'Email', date: '2025-07-03T08:00:00Z', summary: 'Product update email', details: 'Sent product roadmap update for investor review.' }
      ],
      createdAt: '2025-05-20T10:00:00Z',
      updatedAt: '2025-07-03T08:00:00Z',
      lastContactedAt: '2025-07-03T08:00:00Z'
    }
  ];

  for (const contact of sampleContacts) {
    await sql`
      INSERT INTO vercel_contacts (id, data, updated_at)
      VALUES (${contact.id}, ${JSON.stringify(contact)}, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        data = EXCLUDED.data,
        updated_at = CURRENT_TIMESTAMP
    `;
  }
  console.log(`[Seed] Inserted ${sampleContacts.length} sample contacts`);

  const sampleCompanies = [
    { id: 'company-001', userId, name: 'Acme Corp', industry: 'Technology', size: '500-1000', website: 'https://acme-corp.com', address: '123 Tech St, San Francisco, CA', notes: 'Enterprise customer, annual contract worth $150K' },
    { id: 'company-002', userId, name: 'StartupTech', industry: 'SaaS', size: '10-50', website: 'https://startuptech.io', address: '456 Market St, San Francisco, CA', notes: 'Early-stage startup, Series A, high growth potential' },
    { id: 'company-003', userId, name: 'Global Enterprises', industry: 'Enterprise', size: '5000+', website: 'https://global-enterprises.com', address: '789 Corporate Ave, New York, NY', notes: 'Large enterprise opportunity, complex procurement' },
    { id: 'company-004', userId, name: 'Tech Solutions Inc', industry: 'IT Services', size: '100-500', website: 'https://tech-solutions.co', address: '321 Oak St, Austin, TX', notes: 'Mid-market IT services company looking for CRM integration' }
  ];

  for (const company of sampleCompanies) {
    await sql`
      INSERT INTO companies (id, user_id, name, industry, size, website, address, notes, created_at, updated_at)
      VALUES (${company.id}, ${company.userId}, ${company.name}, ${company.industry}, ${company.size}, ${company.website}, ${company.address}, ${company.notes}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `;
  }
  console.log(`[Seed] Inserted ${sampleCompanies.length} sample companies`);

  const sampleDeals = [
    { id: 'deal-001', userId, title: 'Acme Corp Enterprise License', value: 75000, stage: 'negotiation', probability: 75, expectedCloseDate: '2025-08-30', notes: 'Annual license for 200 seats, custom SLA', contactId: 'contact-001', createdAt: '2025-06-15T10:00:00Z', updatedAt: '2025-07-28T09:00:00Z' },
    { id: 'deal-002', userId, title: 'StartupTech Seed Round Investment', value: 50000, stage: 'proposal', probability: 60, expectedCloseDate: '2025-09-15', notes: '6-month pilot, upsell potential', contactId: 'contact-002', createdAt: '2025-06-20T12:00:00Z', updatedAt: '2025-07-18T15:00:00Z' },
    { id: 'deal-003', userId, title: 'Global Enterprises Enterprise Deal', value: 200000, stage: 'qualified', probability: 80, expectedCloseDate: '2025-10-01', notes: 'Complex procurement, security review pending', contactId: 'contact-003', createdAt: '2025-07-01T09:00:00Z', updatedAt: '2025-07-22T14:00:00Z' },
    { id: 'deal-004', userId, title: 'Tech Solutions Inc Integration', value: 15000, stage: 'lead', probability: 30, expectedCloseDate: '2025-09-01', notes: 'Proof of concept stage', contactId: 'contact-004', createdAt: '2025-06-28T14:00:00Z', updatedAt: '2025-06-30T16:00:00Z' },
    { id: 'deal-005', userId, title: 'Designs R Us Renewal', value: 12000, stage: 'won', probability: 100, expectedCloseDate: '2025-07-15', notes: 'Renewal for existing client with 15% price increase', contactId: 'contact-005', createdAt: '2025-05-10T08:00:00Z', updatedAt: '2025-07-12T11:00:00Z' }
  ];

  for (const deal of sampleDeals) {
    await sql`
      INSERT INTO deals (id, user_id, title, value, stage, probability, expected_close_date, notes, contact_id, created_at, updated_at)
      VALUES (${deal.id}, ${deal.userId}, ${deal.title}, ${deal.value}, ${deal.stage}, ${deal.probability}, ${deal.expectedCloseDate}, ${deal.notes}, ${deal.contactId}, ${deal.createdAt}, ${deal.updatedAt})
    `;
  }
  console.log(`[Seed] Inserted ${sampleDeals.length} sample deals`);

  const sampleTasks = [
    { id: 'task-001', userId, title: 'Follow up on Acme Corp contract terms', description: 'Email Sarah about custom SLA options', dueDate: '2025-08-02T17:00:00Z', status: 'pending', priority: 'high', contactId: 'contact-001', dealId: 'deal-001', createdAt: '2025-07-29T10:00:00Z', updatedAt: '2025-07-29T10:00:00Z' },
    { id: 'task-002', userId, title: 'Schedule technical demo with StartupTech', description: 'Coordinate with James for API integration walkthrough', dueDate: '2025-08-05T12:00:00Z', status: 'pending', priority: 'medium', contactId: 'contact-002', dealId: 'deal-002', createdAt: '2025-07-22T16:00:00Z', updatedAt: '2025-07-22T16:00:00Z' },
    { id: 'task-003', userId, title: 'Send security documentation to Global Enterprises', description: 'Provide SOC2 and GDPR compliance docs', dueDate: '2025-08-01T09:00:00Z', status: 'in_progress', priority: 'high', contactId: 'contact-003', dealId: 'deal-003', createdAt: '2025-07-23T14:00:00Z', updatedAt: '2025-07-29T11:00:00Z' },
    { id: 'task-004', userId, title: 'Review Q3 pipeline report', description: 'Prepare deal stage analysis for management review', dueDate: '2025-08-10T17:00:00Z', status: 'pending', priority: 'medium', contactId: null, dealId: null, createdAt: '2025-07-28T09:00:00Z', updatedAt: '2025-07-28T09:00:00Z' },
    { id: 'task-005', userId, title: 'Update Designs R Us contract for renewal', description: 'Draft updated terms with new pricing structure', dueDate: '2025-08-15T17:00:00Z', status: 'pending', priority: 'low', contactId: 'contact-005', dealId: 'deal-005', createdAt: '2025-07-29T09:00:00Z', updatedAt: '2025-07-29T09:00:00Z' }
  ];

  for (const task of sampleTasks) {
    await sql`
      INSERT INTO tasks (id, user_id, title, description, due_date, status, priority, contact_id, deal_id, created_at, updated_at)
      VALUES (${task.id}, ${task.userId}, ${task.title}, ${task.description}, ${task.dueDate}, ${task.status}, ${task.priority}, ${task.contactId}, ${task.dealId}, ${task.createdAt}, ${task.updatedAt})
    `;
  }
  console.log(`[Seed] Inserted ${sampleTasks.length} sample tasks`);

  const sampleReminders = [
    { id: 'reminder-001', userId, type: 'follow_up', title: 'Call Sarah Chen about contract', message: 'Follow up on Acme Corp enterprise deal - check on contract sign-off status', remindAt: '2025-08-02T10:00:00Z', recurrence: 'none', status: 'active', snoozedUntil: null, contactId: 'contact-001', createdAt: '2025-07-29T10:00:00Z', updatedAt: '2025-07-29T10:00:00Z' },
    { id: 'reminder-002', userId, type: 'follow_up', title: 'Check on Global Enterprises security review', message: 'Follow up on security documentation sent for enterprise deal', remindAt: '2025-08-05T14:00:00Z', recurrence: 'none', status: 'active', snoozedUntil: null, contactId: 'contact-003', createdAt: '2025-07-28T14:00:00Z', updatedAt: '2025-07-28T14:00:00Z' },
    { id: 'reminder-003', userId, type: 'birthday', title: 'Marcus Rodriguez birthday', message: 'Send birthday wishes to Marcus at StartupTech', remindAt: '2025-08-15T09:00:00Z', recurrence: 'yearly', status: 'active', snoozedUntil: null, contactId: 'contact-002', createdAt: '2025-07-01T00:00:00Z', updatedAt: '2025-07-01T00:00:00Z' }
  ];

  for (const reminder of sampleReminders) {
    await sql`
      INSERT INTO reminders (id, user_id, contact_id, deal_id, type, title, message, remind_at, recurrence, status, snoozed_until, created_at, updated_at)
      VALUES (${reminder.id}, ${reminder.userId}, ${reminder.contactId}, ${null}, ${reminder.type}, ${reminder.title}, ${reminder.message}, ${reminder.remindAt}, ${reminder.recurrence}, ${reminder.status}, ${reminder.snoozedUntil}, ${reminder.createdAt}, ${reminder.updatedAt})
    `;
  }
  console.log(`[Seed] Inserted ${sampleReminders.length} sample reminders`);

  console.log('[Seed] Database seeding complete');
}

startServer();
