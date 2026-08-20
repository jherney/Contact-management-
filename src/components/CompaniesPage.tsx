import React, { useState } from 'react';
import {
  Plus,
  Building2,
  Globe,
  MapPin,
  Users,
  FileText,
  X,
  Edit3,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { Company, Contact } from '../types';
import { useCrm } from '../contexts/CrmContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface CompaniesPageProps {
  contacts: Contact[];
}

export const CompaniesPage: React.FC<CompaniesPageProps> = ({ contacts }) => {
  const { companies, addCompany, updateCompany, deleteCompany } = useCrm();
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('');
  const [website, setWebsite] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const getContactsAtCompany = (companyId: string) => {
    return contacts.filter((c) => c.company === companies.find((co) => co.id === companyId)?.name);
  };

  const handleOpenAdd = () => {
    setEditingCompany(null);
    setName('');
    setIndustry('');
    setSize('');
    setWebsite('');
    setAddress('');
    setNotes('');
    setError(null);
    setShowForm(true);
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setName(company.name);
    setIndustry(company.industry || '');
    setSize(company.size || '');
    setWebsite(company.website || '');
    setAddress(company.address || '');
    setNotes(company.notes || '');
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Company name is required.');
      return;
    }
    setError(null);

    const companyData: any = {
      name: name.trim(),
      industry: industry.trim() || undefined,
      size: size.trim() || undefined,
      website: website.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    if (editingCompany) {
      await updateCompany(editingCompany.id, companyData);
    } else {
      await addCompany(companyData);
    }
    setShowForm(false);
  };

  const handleDelete = async (company: Company) => {
    if (window.confirm(`Delete company "${company.name}"?`)) {
      await deleteCompany(company.id);
    }
  };

  const sortedCompanies = [...companies].sort((a, b) => a.name.localeCompare(b.name));

  if (!isAuthenticated) {
    return (
      <div className="p-8 bg-[#141414] border border-white/[0.08] rounded-3xl text-center space-y-4">
        <Building2 className="w-8 h-8 text-[#ff4d00] mx-auto" />
        <h3 className="text-lg font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)' }}>
          Sign in to manage companies
        </h3>
        <p className="text-sm text-[#fafaf9]/50">Create company records to group contacts by organization.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)' }}>
            Companies
          </h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] text-[#fafaf9]/60 font-mono border border-white/[0.08]">
            {companies.length} {companies.length === 1 ? 'company' : 'companies'}
          </span>
        </div>

        <motion.button
          id="add-company-btn"
          onClick={handleOpenAdd}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2.5 bg-[#ff4d00] hover:bg-[#ff6a2f] text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-[#ff4d00]/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Company</span>
        </motion.button>
      </div>

      {/* Companies List */}
      <AnimatePresence>
        {sortedCompanies.length > 0 ? (
          <motion.div
            id="companies-list"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {sortedCompanies.map((company) => {
              const companyContacts = getContactsAtCompany(company.id);
              return (
                <motion.div
                  key={company.id}
                  id={`company-card-${company.id}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="group p-6 bg-[#141414] border border-white/[0.08] hover:border-[#ff4d00]/30 rounded-3xl transition-all"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-[#ff4d00]/10 flex items-center justify-center text-[#ff4d00]">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-[#fafaf9] group-hover:text-[#ff4d00] transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                          {company.name}
                        </h3>
                        {company.industry && (
                          <p className="text-xs text-[#fafaf9]/50">{company.industry}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <motion.button
                        id={`edit-company-${company.id}`}
                        onClick={() => handleEdit(company)}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded-xl text-[#fafaf9]/40 hover:text-[#fafaf9] hover:bg-white/[0.06] transition-colors"
                        title="Edit company"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button
                        id={`delete-company-${company.id}`}
                        onClick={() => handleDelete(company)}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded-xl text-[#fafaf9]/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete company"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    {company.website && (
                      <div className="flex items-center gap-2 text-[#fafaf9]/60">
                        <Globe className="w-3.5 h-3.5 text-[#8b5cf6]" />
                        <a
                          href={company.website.startsWith('http') ? company.website : `https://${company.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#ff4d00] hover:underline truncate"
                        >
                          {company.website}
                        </a>
                      </div>
                    )}

                    {company.address && (
                      <div className="flex items-start gap-2 text-[#fafaf9]/60">
                        <MapPin className="w-3.5 h-3.5 text-[#f43f5e] mt-0.5" />
                        <span className="truncate">{company.address}</span>
                      </div>
                    )}

                    {company.size && (
                      <div className="flex items-center gap-2 text-[#fafaf9]/60">
                        <Users className="w-3.5 h-3.5 text-[#3b82f6]" />
                        <span>{company.size} employees</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[#fafaf9]/60 pt-2 border-t border-white/[0.04]">
                      <Users className="w-3.5 h-3.5 text-[#10b981]" />
                      <span>{companyContacts.length} {companyContacts.length === 1 ? 'contact' : 'contacts'} linked</span>
                    </div>
                  </div>

                  {companyContacts.length > 0 && (
                    <div className="mt-4 flex -space-x-2 overflow-hidden">
                      {companyContacts.slice(0, 4).map((c) => (
                        <div
                          key={c.id}
                          className={`w-7 h-7 rounded-full ${c.avatarBgColor || 'bg-[#ff4d00]'} flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-[#141414]`}
                          style={{ fontFamily: 'var(--font-display)' }}
                          title={`${c.firstName} ${c.lastName}`}
                        >
                          {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                        </div>
                      ))}
                      {companyContacts.length > 4 && (
                        <div className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[#fafaf9]/50 text-[9px] font-bold">
                          +{companyContacts.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  {company.notes && (
                    <div className="mt-4 p-3 bg-white/[0.02] rounded-2xl border border-white/[0.06]">
                      <div className="flex items-start gap-2">
                        <FileText className="w-3.5 h-3.5 text-[#fafaf9]/30 mt-0.5" />
                        <p className="text-xs text-[#fafaf9]/60 leading-relaxed line-clamp-2">{company.notes}</p>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="py-20 text-center bg-[#141414] border border-white/[0.08] rounded-3xl space-y-6"
          >
            <Building2 className="w-12 h-12 text-[#fafaf9]/10 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)' }}>
                No companies yet
              </h3>
              <p className="text-sm text-[#fafaf9]/50 max-w-sm mx-auto">
                Create company records to group related contacts and track organization-level details.
              </p>
            </div>
            <motion.button
              id="empty-add-company-btn"
              onClick={handleOpenAdd}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-5 py-2.5 bg-[#ff4d00] hover:bg-[#ff6a2f] text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-[#ff4d00]/20 flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Company</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Company Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            id="company-form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              id="company-form-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#141414] border border-white/[0.08] rounded-[2rem] shadow-2xl p-6 sm:p-8 text-[#fafaf9]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {editingCompany ? 'Edit Company' : 'New Company'}
                </h3>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 text-[#fafaf9]/40 hover:text-[#fafaf9] hover:bg-white/[0.06] rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mt-5 space-y-5">
                {error && (
                  <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs flex items-center gap-3">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">
                    Company Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="company-name-input"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Acme Corp"
                    className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">
                      Industry
                    </label>
                    <input
                      id="company-industry-input"
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. Technology"
                      className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">
                      Company Size
                    </label>
                    <input
                      id="company-size-input"
                      type="text"
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      placeholder="e.g. 10-50"
                      className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-3.5 h-3.5 text-[#8b5cf6]" /> Website
                  </label>
                  <input
                    id="company-website-input"
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-[#f43f5e]" /> Address
                  </label>
                  <input
                    id="company-address-input"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Headquarters address"
                    className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-[#ff4d00]" /> Notes
                  </label>
                  <textarea
                    id="company-notes-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Company background, relationship context..."
                    rows={3}
                    className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 resize-none transition-all"
                  />
                </div>
              </form>

              <div className="pt-5 border-t border-white/[0.08] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-5 py-2.5 text-[#fafaf9]/50 hover:text-[#fafaf9] font-semibold transition-colors"
                >
                  Cancel
                </button>
                <motion.button
                  id="save-company-btn"
                  type="submit"
                  onClick={handleSubmit}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2.5 bg-[#ff4d00] hover:bg-[#ff6a2f] text-white font-bold rounded-2xl shadow-lg shadow-[#ff4d00]/20 text-sm transition-all"
                >
                  {editingCompany ? 'Save Changes' : 'Create Company'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
