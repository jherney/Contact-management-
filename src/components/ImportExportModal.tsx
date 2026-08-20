import React, { useState } from 'react';
import { X, Download, Upload, FileText, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Contact } from '../types';
import { exportContactsToCSV, exportContactsToJSON } from '../utils/contactUtils';
import { processImportedContacts } from '../utils/validation';
import { motion } from 'motion/react';

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
            userId: item.userId || item.user_id || 'imported-user',
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
              userId: 'imported-user',
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
    <motion.div
      id="import-export-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        id="import-export-card"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-[#141414] border border-white/[0.08] rounded-[2rem] shadow-2xl p-6 sm:p-8 text-[#fafaf9] space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <h2 className="text-lg font-bold text-white flex items-center gap-3" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
            <Download className="w-5 h-5 text-[#ff4d00]" /> Data Backup & Sync
          </h2>
          <button
            id="close-import-export-btn"
            onClick={onClose}
            className="p-2 text-[#fafaf9]/40 hover:text-[#fafaf9] hover:bg-white/[0.06] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Export Section */}
        <div className="space-y-4">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#fafaf9]/50 block mb-1">Export Directory</h3>
            <p className="text-xs text-[#fafaf9]/60">Export your complete contact list ({contacts.length} items) for spreadsheets or full database backups.</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => exportContactsToCSV(contacts)}
              className="px-4 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#fafaf9] text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-[#10b981]" />
              <span>Export CSV</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => exportContactsToJSON(contacts)}
              className="px-4 py-3 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#fafaf9] text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4 text-[#ff4d00]" />
              <span>Export JSON</span>
            </motion.button>
          </div>
        </div>

        {/* Import Section */}
        <div className="space-y-4 pt-4 border-t border-white/[0.08]">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#fafaf9]/50 block mb-1">Import Backup</h3>
            <p className="text-xs text-[#fafaf9]/60">Upload a JSON or CSV backup file to restore or merge contacts into your directory.</p>
          </div>

          {/* Duplicate Strategy selector */}
          <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.08] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-[#fafaf9]">
                <ShieldCheck className="w-4 h-4 text-[#ff4d00]" />
                <span>Duplicate Handling</span>
              </div>
              <span className="text-[10px] text-[#fafaf9]/40">
                {duplicateStrategy === 'skip' && 'Skips existing contacts'}
                {duplicateStrategy === 'replace' && 'Updates matching contacts'}
                {duplicateStrategy === 'allow' && 'Imports all entries'}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['skip', 'replace', 'allow'] as const).map((strategy) => (
                <motion.button
                  key={strategy}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setDuplicateStrategy(strategy)}
                  className={`py-2.5 px-3 rounded-xl text-[11px] font-bold border transition-all ${
                    duplicateStrategy === strategy
                      ? 'bg-[#ff4d00] border-[#ff4d00] text-white shadow-lg shadow-[#ff4d00]/20'
                      : 'bg-[#0a0a0a] border-white/[0.08] text-[#fafaf9]/60 hover:border-white/[0.15]'
                  }`}
                >
                  {strategy === 'skip' ? 'Skip' : strategy === 'replace' ? 'Replace' : 'Allow'}
                </motion.button>
              ))}
            </div>
          </div>

          <label className="block cursor-pointer">
            <div className="p-8 bg-white/[0.02] hover:bg-white/[0.04] border-2 border-dashed border-white/[0.08] hover:border-[#ff4d00]/30 rounded-3xl text-center transition-all space-y-3">
              <Upload className="w-10 h-10 text-[#ff4d00] mx-auto" />
              <div className="text-xs font-bold text-[#fafaf9]">
                Click to browse or drop JSON or CSV file
              </div>
              <p className="text-[11px] text-[#fafaf9]/40">Supports .json and .csv contact files (Max 5MB)</p>
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
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs flex items-center gap-3"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{importError}</span>
            </motion.div>
          )}

          {importSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-[#10b981]/10 border border-[#10b981]/20 rounded-2xl text-[#10b981] text-xs flex items-center gap-3"
            >
              <CheckCircle2 className="w-4 h-4 text-[#10b981] shrink-0" />
              <span>{importSuccessMsg}</span>
            </motion.div>
          )}
        </div>

        <div className="pt-2 text-right">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className="px-6 py-3 bg-[#ff4d00] hover:bg-[#ff6a2f] text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#ff4d00]/20 text-sm"
          >
            Done
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
};
