import React, { useState } from 'react';
import { X, Download, Upload, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Contact } from '../types';
import { exportContactsToCSV, exportContactsToJSON } from '../utils/contactUtils';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onImportContacts: (imported: Contact[]) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  contacts,
  onImportContacts
}) => {
  if (!isOpen) return null;

  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccessMsg(null);

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!Array.isArray(parsed)) {
          throw new Error('Import file must contain a JSON array of contacts.');
        }

        // Validate basic properties
        const validContacts: Contact[] = parsed.map((item: any, idx: number) => ({
          id: item.id || `imported-${Date.now()}-${idx}`,
          firstName: item.firstName || 'Unknown',
          lastName: item.lastName || '',
          email: item.email || '',
          phone: item.phone || '',
          company: item.company || '',
          jobTitle: item.jobTitle || '',
          category: item.category || 'Other',
          tags: Array.isArray(item.tags) ? item.tags : [],
          isFavorite: Boolean(item.isFavorite),
          address: item.address || '',
          website: item.website || '',
          linkedIn: item.linkedIn || '',
          notes: item.notes || '',
          interactions: Array.isArray(item.interactions) ? item.interactions : [],
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));

        onImportContacts(validContacts);
        setImportSuccessMsg(`Successfully imported ${validContacts.length} contacts!`);
      } catch (err: any) {
        setImportError(err.message || 'Failed to parse JSON backup file.');
      }
    };

    reader.readAsText(file);
  };

  return (
    <div
      id="import-export-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="import-export-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-100 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-400" /> Data Backup & Synchronization
          </h2>
          <button
            id="close-import-export-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Export Directory
          </h3>
          <p className="text-xs text-slate-300">
            Export your complete contact list ({contacts.length} items) for spreadsheets or full database backups.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              id="export-csv-btn"
              onClick={() => exportContactsToCSV(contacts)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              id="export-json-btn"
              onClick={() => exportContactsToJSON(contacts)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-100 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Import Backup
          </h3>
          <p className="text-xs text-slate-300">
            Upload a previously exported JSON contacts backup file to merge or restore directory data.
          </p>

          <label className="block cursor-pointer">
            <div className="p-6 bg-slate-800/40 hover:bg-slate-800/70 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl text-center transition-all space-y-2">
              <Upload className="w-8 h-8 text-indigo-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-200">
                Click to browse or drop JSON file
              </div>
              <p className="text-[11px] text-slate-500">Supports .json contact backup files</p>
            </div>
            <input
              id="import-file-input"
              type="file"
              accept=".json"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {importError && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importSuccessMsg && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-800/50 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{importSuccessMsg}</span>
            </div>
          )}
        </div>

        <div className="pt-2 text-right">
          <button
            id="done-import-export-btn"
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
