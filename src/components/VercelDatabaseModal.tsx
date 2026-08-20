import React, { useState, useEffect } from 'react';
import { X, Database, Server, CheckCircle2, RefreshCw, Layers, ShieldCheck, HelpCircle, ExternalLink, HardDrive, Cpu, Code2, Terminal } from 'lucide-react';
import { getDatabaseStatus, DatabaseStatus, fetchRemoteContacts, saveContactsToDatabase } from '../services/vercelDatabase';
import { Contact } from '../types';
import { motion } from 'motion/react';

interface VercelDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onContactsUpdated: (contacts: Contact[]) => void;
  showToast: (msg: string) => void;
}

export const VercelDatabaseModal: React.FC<VercelDatabaseModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onContactsUpdated,
  showToast
}) => {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'schema' | 'instructions'>('overview');
  const [schemaData, setSchemaData] = useState<any>(null);

  const refreshStatus = async () => {
    setLoading(true);
    try {
      const dbStatus = await getDatabaseStatus();
      setStatus(dbStatus);

      const schemaRes = await fetch('/api/postgres/schema');
      if (schemaRes.ok) {
        const data = await schemaRes.json();
        setSchemaData(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const res = await saveContactsToDatabase(contacts);
      showToast(res.message);
      await refreshStatus();
    } catch (e) {
      showToast('Failed to sync to database.');
    } finally {
      setSyncing(false);
    }
  };

  const handleFetchFromDatabase = async () => {
    setFetching(true);
    try {
      const remoteContacts = await fetchRemoteContacts();
      if (remoteContacts && remoteContacts.length > 0) {
        onContactsUpdated(remoteContacts);
        showToast(`Fetched ${remoteContacts.length} contacts from Vercel Postgres!`);
        await refreshStatus();
      } else {
        showToast('No contacts found in remote Postgres database yet.');
      }
    } catch (e) {
      showToast('Failed to fetch from remote Postgres database.');
    } finally {
      setFetching(false);
    }
  };

  return (
    <motion.div
      id="vercel-db-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        id="vercel-db-modal-card"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#141414] border border-white/[0.08] rounded-[2rem] shadow-2xl overflow-hidden text-[#fafaf9] flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.08] bg-[#0a0a0a]/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#ff4d00]/10 text-[#ff4d00] rounded-xl border border-[#ff4d00]/20">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
                Database Status
              </h2>
              <div className="flex items-center gap-2.5 mt-2">
                <span>Vercel Postgres Database</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Active SQL Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Serverless PostgreSQL backend powered by @vercel/postgres & Neon
              </p>
            </div>
          </div>
          <button
            id="close-vercel-db-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-5 pt-2 gap-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'overview'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Postgres Connection</span>
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'schema'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>SQL Schema & DDL</span>
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'instructions'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Vercel Setup Guide</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'overview' && (
            <>
              {/* Active Provider Card */}
              <div className="p-5 bg-slate-800/50 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-bold text-white">Active Storage Engine</span>
                  </div>
                  <button
                    onClick={refreshStatus}
                    disabled={loading}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700 text-xs flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    <span>Check Status</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[11px] font-medium text-slate-400">Database Engine</span>
                    <p className="text-sm font-semibold text-indigo-300 flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-indigo-400" />
                      <span>{status?.providerName || 'Checking connection...'}</span>
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[11px] font-medium text-slate-400">Synced Contacts</span>
                    <p className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{contacts.length} Contact Records</span>
                    </p>
                  </div>
                </div>

                {status?.lastSyncedAt && (
                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Last synchronized: {new Date(status.lastSyncedAt).toLocaleString()}</span>
                  </p>
                )}

                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
                  {status?.message || 'Contact data is safely stored and synchronized across your session.'}
                </p>
              </div>

              {/* Supported Vercel Databases Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Supported Vercel Database Solutions
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Vercel Postgres */}
                  <div className={`p-4 rounded-xl border transition-all space-y-2 ${
                    status?.envVarsPresent?.postgresUrl
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-slate-800/30 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Database className="w-4 h-4 text-indigo-400" />
                        <span>Vercel Postgres</span>
                      </span>
                      {status?.envVarsPresent?.postgresUrl ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Connected
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                          Available
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Serverless SQL database powered by Neon. Stores structured contacts in PostgreSQL tables.
                    </p>
                  </div>

                  {/* Vercel KV */}
                  <div className={`p-4 rounded-xl border transition-all space-y-2 ${
                    status?.envVarsPresent?.kvUrl
                      ? 'bg-emerald-950/20 border-emerald-500/40'
                      : 'bg-slate-800/30 border-slate-800'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-indigo-400" />
                        <span>Vercel KV (Redis)</span>
                      </span>
                      {status?.envVarsPresent?.kvUrl ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Connected
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                          Available
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      High-speed Redis key-value store. Delivers ultra-low latency contact persistence across Vercel Edge functions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  id="sync-to-vercel-db-btn"
                  onClick={handleManualSync}
                  disabled={syncing}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-semibold text-xs transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Saving to Database...' : 'Save Current Contacts to Database'}</span>
                </button>

                <button
                  id="fetch-from-vercel-db-btn"
                  onClick={handleFetchFromDatabase}
                  disabled={fetching}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white rounded-xl font-semibold text-xs border border-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span>{fetching ? 'Fetching...' : 'Fetch Remote Records'}</span>
                </button>
              </div>
            </>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2 mb-2 font-sans">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    <span>PostgreSQL DDL Table Definition</span>
                  </span>
                  <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                    {schemaData?.dialect || 'PostgreSQL 15+'}
                  </span>
                </div>
                <pre className="text-emerald-400 overflow-x-auto text-[11px] leading-relaxed">
                  {schemaData?.ddl || `CREATE TABLE IF NOT EXISTS vercel_contacts (
  id VARCHAR(255) PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);`}
                </pre>
              </div>

              <div className="space-y-2 font-mono">
                <h4 className="font-bold text-slate-300 font-sans text-xs uppercase tracking-wider">
                  PostgreSQL Table Indexes
                </h4>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5 text-indigo-300 text-[11px] overflow-x-auto">
                  {schemaData?.indexes?.map((idx: string, index: number) => (
                    <div key={index}>• {idx}</div>
                  )) || (
                    <div>• CREATE UNIQUE INDEX vercel_contacts_pkey ON vercel_contacts(id);</div>
                  )}
                </div>
              </div>

              <div className="space-y-2 font-mono">
                <h4 className="font-bold text-slate-300 font-sans text-xs uppercase tracking-wider">
                  Executed SQL Statements
                </h4>
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-slate-300 text-[11px] overflow-x-auto">
                  <div>
                    <span className="text-amber-400 font-semibold">UPSERT Query:</span>
                    <pre className="text-slate-400 text-[10px] mt-1 whitespace-pre-wrap">
                      {schemaData?.sampleQueries?.insert || `INSERT INTO vercel_contacts (id, data, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP) ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = CURRENT_TIMESTAMP;`}
                    </pre>
                  </div>
                  <div>
                    <span className="text-sky-400 font-semibold">FETCH Query:</span>
                    <pre className="text-slate-400 text-[10px] mt-1">
                      {schemaData?.sampleQueries?.select || `SELECT data FROM vercel_contacts ORDER BY updated_at DESC;`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-5 text-xs text-slate-300">
              <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-2xl space-y-2">
                <h4 className="font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" />
                  <span>Connecting Vercel Postgres or Vercel KV</span>
                </h4>
                <p className="text-slate-300 leading-relaxed">
                  When deploying this app to Vercel via GitHub or Vercel CLI, you can connect a serverless Vercel Postgres or Vercel KV database in under 1 minute.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                  Option A: Vercel Postgres (Recommended)
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-400 leading-relaxed bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                  <li>In your Vercel Project Dashboard, navigate to the <strong className="text-white">Storage</strong> tab.</li>
                  <li>Click <strong className="text-white">Create Database</strong> and select <strong className="text-indigo-300">Postgres</strong>.</li>
                  <li>Select your project and click <strong className="text-white">Connect</strong>.</li>
                  <li>Vercel automatically populates <code className="text-indigo-300 bg-slate-900 px-1.5 py-0.5 rounded">POSTGRES_URL</code> environment variables in your project settings.</li>
                </ol>
              </div>

              <div className="space-y-3">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                  Option B: Vercel KV (Redis)
                </h4>
                <ol className="list-decimal list-inside space-y-2 text-slate-400 leading-relaxed bg-slate-800/40 p-4 rounded-xl border border-slate-800">
                  <li>In your Vercel Project Dashboard, navigate to <strong className="text-white">Storage</strong> tab.</li>
                  <li>Click <strong className="text-white">Create Database</strong> and select <strong className="text-indigo-300">KV (Redis)</strong>.</li>
                  <li>Click <strong className="text-white">Connect</strong> to inject <code className="text-indigo-300 bg-slate-900 px-1.5 py-0.5 rounded">KV_REST_API_URL</code> and <code className="text-indigo-300 bg-slate-900 px-1.5 py-0.5 rounded">KV_REST_API_TOKEN</code>.</li>
                </ol>
              </div>

              <div className="pt-2">
                <a
                  href="https://vercel.com/docs/storage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-indigo-400 hover:text-indigo-300 font-semibold text-xs"
                >
                  <span>Open Vercel Storage Documentation</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between text-xs text-slate-400">
          <span>Zero configuration required for local persistence</span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition-colors border border-slate-700"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
