import React, { useState } from 'react';
import { X, Download, Upload, FileText, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Contact } from '../types';
import { exportContactsToCSV, exportContactsToJSON } from '../utils/contactUtils';
import { processImportedContacts } from '../utils/validation';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  onImportContacts: (imported: Contact[], strategy?: 'skip' | 'replace' | 'allow') => void;
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
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'replace' | 'allow'>('skip');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccessMsg(null);

    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be re-selected if needed
    e.target.value = '';

    // File size check (Max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImportError('File size exceeds the 5MB limit. Please upload a smaller file.');
      return;
    }

    const isJson = file.name.endsWith('.json');
    const isCsv = file.name.endsWith('.csv');

    if (!isJson && !isCsv) {
      setImportError('Invalid file type. Please select a valid .json or .csv backup file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        if (!content || !content.trim()) {
          throw new Error('Selected file is empty.');
        }

        let parsedRawContacts: Contact[] = [];

        if (isJson) {
          let parsed: any;
          try {
            parsed = JSON.parse(content);
          } catch {
            throw new Error('Invalid JSON structure. Please check the file format.');
          }

          if (!Array.isArray(parsed)) {
            throw new Error('Import file must contain a JSON array of contact objects.');
          }

          if (parsed.length === 0) {
            throw new Error('The JSON file contains an empty contact list.');
          }

          parsedRawContacts = parsed.map((item: any, idx: number) => ({
            id: item.id || `imported-${Date.now()}-${idx}`,
            firstName: String(item.firstName || item['First Name'] || 'Unknown').trim(),
            lastName: String(item.lastName || item['Last Name'] || '').trim(),
            email: String(item.email || item['Email'] || '').trim(),
            phone: String(item.phone || item['Phone'] || '').trim(),
            company: String(item.company || item['Company'] || '').trim(),
            jobTitle: String(item.jobTitle || item['Job Title'] || '').trim(),
            category: item.category || item['Category'] || 'Other',
            tags: Array.isArray(item.tags) ? item.tags : (item.tags ? String(item.tags).split(';').map(t => t.trim()) : []),
            isFavorite: Boolean(item.isFavorite || item['Favorite'] === 'Yes'),
            address: String(item.address || item['Address'] || '').trim(),
            website: String(item.website || item['Website'] || '').trim(),
            linkedIn: String(item.linkedIn || item['LinkedIn'] || '').trim(),
            notes: String(item.notes || item['Notes'] || '').trim(),
            interactions: Array.isArray(item.interactions) ? item.interactions : [],
            createdAt: item.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }));
        } else if (isCsv) {
          const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
          if (lines.length < 2) {
            throw new Error('CSV file must contain a header row and at least one contact row.');
          }

          const parseCsvRow = (rowStr: string): string[] => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < rowStr.length; i++) {
              const char = rowStr[i];
              if (char === '"' && (i === 0 || rowStr[i - 1] !== '\\')) {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                result.push(current.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current.replace(/^"|"$/g, '').replace(/""/g, '"').trim());
            return result;
          };

          const headers = parseCsvRow(lines[0]).map(h => h.toLowerCase());
          const firstNameIdx = headers.findIndex(h => h.includes('first name') || h === 'firstname' || h === 'name');
          const lastNameIdx = headers.findIndex(h => h.includes('last name') || h === 'lastname');
          const emailIdx = headers.findIndex(h => h.includes('email'));
          const phoneIdx = headers.findIndex(h => h.includes('phone'));
          const companyIdx = headers.findIndex(h => h.includes('company'));
          const jobTitleIdx = headers.findIndex(h => h.includes('job') || h.includes('title'));
          const categoryIdx = headers.findIndex(h => h.includes('category'));
          const tagsIdx = headers.findIndex(h => h.includes('tags') || h.includes('tag'));

          parsedRawContacts = lines.slice(1).map((line, idx) => {
            const cols = parseCsvRow(line);
            return {
              id: `imported-csv-${Date.now()}-${idx}`,
              firstName: cols[firstNameIdx] || cols[0] || 'Unknown',
              lastName: cols[lastNameIdx] || (lastNameIdx !== -1 ? '' : cols[1]) || '',
              email: cols[emailIdx] || '',
              phone: cols[phoneIdx] || '',
              company: cols[companyIdx] || '',
              jobTitle: cols[jobTitleIdx] || '',
              category: (cols[categoryIdx] as any) || 'Other',
              tags: cols[tagsIdx] ? cols[tagsIdx].split(';').map(t => t.trim()).filter(Boolean) : [],
              isFavorite: false,
              interactions: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          });
        }

        if (parsedRawContacts.length === 0) {
          throw new Error('No valid contacts could be found in the file.');
        }

        // Process duplicate detection & filtering
        const processed = processImportedContacts(parsedRawContacts, contacts, duplicateStrategy);

        if (processed.validContacts.length === 0 && processed.skippedExistingCount > 0) {
          setImportError(`All ${parsedRawContacts.length} contact(s) in the file already exist in your directory.`);
          return;
        }

        onImportContacts(processed.validContacts, duplicateStrategy);

        let successMsg = `Successfully imported ${processed.addedCount} new contact(s)!`;
        if (processed.updatedCount > 0) {
          successMsg = `Successfully updated ${processed.updatedCount} existing contact(s) and added ${processed.addedCount} new contact(s)!`;
        }
        const notesList: string[] = [];
        if (processed.skippedExistingCount > 0) {
          notesList.push(`${processed.skippedExistingCount} existing duplicate(s) skipped`);
        }
        if (processed.internalDuplicateCount > 0) {
          notesList.push(`${processed.internalDuplicateCount} duplicate row(s) inside file removed`);
        }
        if (processed.cleanedFieldCount > 0) {
          notesList.push(`${processed.cleanedFieldCount} field(s) verified & sanitized`);
        }

        if (notesList.length > 0) {
          successMsg += ` (${notesList.join(', ')})`;
        }

        setImportSuccessMsg(successMsg);
      } catch (err: any) {
        setImportError(err.message || 'Failed to process file. Please ensure it is a valid format.');
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
            Upload a JSON or CSV backup file to restore or merge contacts into your directory.
          </p>

          {/* Duplicate Strategy selector */}
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Duplicate Handling Strategy</span>
              </div>
              <span className="text-[10px] text-slate-400">
                {duplicateStrategy === 'skip' && 'Skips existing contacts & internal duplicates'}
                {duplicateStrategy === 'replace' && 'Updates matching existing contacts'}
                {duplicateStrategy === 'allow' && 'Imports all entries unconditionally'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <button
                type="button"
                id="dup-strategy-skip-btn"
                onClick={() => setDuplicateStrategy('skip')}
                className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-all ${
                  duplicateStrategy === 'skip'
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 font-semibold shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                Skip Duplicates
              </button>
              <button
                type="button"
                id="dup-strategy-replace-btn"
                onClick={() => setDuplicateStrategy('replace')}
                className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-all ${
                  duplicateStrategy === 'replace'
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 font-semibold shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                Update Existing
              </button>
              <button
                type="button"
                id="dup-strategy-allow-btn"
                onClick={() => setDuplicateStrategy('allow')}
                className={`py-1.5 px-2 rounded-lg font-medium border text-center transition-all ${
                  duplicateStrategy === 'allow'
                    ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200 font-semibold shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                Import All
              </button>
            </div>
          </div>

          <label className="block cursor-pointer">
            <div className="p-6 bg-slate-800/40 hover:bg-slate-800/70 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl text-center transition-all space-y-2">
              <Upload className="w-8 h-8 text-indigo-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-200">
                Click to browse or drop JSON or CSV file
              </div>
              <p className="text-[11px] text-slate-500">Supports .json and .csv contact files (Max 5MB)</p>
            </div>
            <input
              id="import-file-input"
              type="file"
              accept=".json,.csv"
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
