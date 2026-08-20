import React, { useState } from 'react';
import {
  X,
  Star,
  Mail,
  Phone,
  Building2,
  MapPin,
  Globe,
  Linkedin,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Check,
  Calendar,
  MessageSquare,
  FileText,
  Tag,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { Contact, InteractionNote } from '../types';
import { getInitials, formatRelativeTime } from '../utils/contactUtils';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface ContactDetailModalProps {
  contact: Contact | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: string) => void;
  onAddInteraction: (contactId: string, interaction: InteractionNote) => void;
  onDeleteInteraction: (contactId: string, interactionId: string) => void;
}

export const ContactDetailModal: React.FC<ContactDetailModalProps> = ({
  contact,
  onClose,
  onToggleFavorite,
  onEdit,
  onDelete,
  onAddInteraction,
  onDeleteInteraction
}) => {
  const { isAuthenticated } = useAuth();
  if (!contact) return null;

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // New Interaction Form State
  const [showAddLog, setShowAddLog] = useState(false);
  const [logType, setLogType] = useState<InteractionNote['type']>('Call');
  const [logSummary, setLogSummary] = useState('');
  const [logDetails, setLogDetails] = useState('');
  const [logError, setLogError] = useState<string | null>(null);

  const initials = getInitials(contact.firstName, contact.lastName);

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    setLogError(null);

    const trimmedSummary = logSummary.trim();
    if (!trimmedSummary) {
      setLogError('Summary is required.');
      return;
    }

    if (trimmedSummary.length < 2) {
      setLogError('Summary must be at least 2 characters long.');
      return;
    }

    const newNote: InteractionNote = {
      id: `int-${Date.now()}`,
      type: logType,
      date: new Date().toISOString(),
      summary: trimmedSummary,
      details: logDetails.trim() || undefined
    };

    onAddInteraction(contact.id, newNote);
    setLogSummary('');
    setLogDetails('');
    setLogError(null);
    setShowAddLog(false);
  };

  const getLogTypeBadge = (type: InteractionNote['type']) => {
    switch (type) {
      case 'Call':
        return 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20';
      case 'Email':
        return 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20';
      case 'Meeting':
        return 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20';
      case 'Follow-up':
        return 'bg-[#ff4d00]/10 text-[#ff4d00] border-[#ff4d00]/20';
      default:
        return 'bg-white/[0.06] text-[#fafaf9]/60 border-white/[0.08]';
    }
  };

  return (
    <motion.div
      id="contact-detail-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        id="contact-detail-card"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#141414] border border-white/[0.08] rounded-[2rem] shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-[#fafaf9]"
      >
        {/* Header / Banner */}
        <div className="relative bg-gradient-to-br from-[#1a1a1a] via-[#141414] to-[#0a0a0a] p-6 sm:p-8 border-b border-white/[0.08] flex-shrink-0">
          <button
            id="close-detail-modal-button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-[#fafaf9]/40 hover:text-[#fafaf9] bg-white/[0.04] hover:bg-white/[0.08] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {contact.avatarUrl ? (
              <img
                src={contact.avatarUrl}
                alt={`${contact.firstName} ${contact.lastName}`}
                className="w-24 h-24 rounded-3xl object-cover ring-4 ring-white/[0.08] shadow-2xl flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className={`w-24 h-24 rounded-3xl ${
                  contact.avatarBgColor || 'bg-[#ff4d00]'
                } flex items-center justify-center text-white font-bold text-3xl shadow-2xl ring-4 ring-white/[0.08] flex-shrink-0`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {initials}
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)' }}>
                  {contact.firstName} {contact.lastName}
                </h2>
                <motion.button
                  id={`toggle-fav-detail-${contact.id}`}
                  onClick={() => onToggleFavorite(contact.id)}
                  className="p-2 rounded-xl hover:bg-white/[0.06] text-[#fafaf9]/40 hover:text-[#ff4d00] transition-colors"
                  whileTap={{ scale: 0.9 }}
                >
                  <Star
                    className={`w-5 h-5 ${
                      contact.isFavorite ? 'fill-[#ff4d00] text-[#ff4d00]' : 'text-[#fafaf9]/30'
                    }`}
                  />
                </motion.button>
              </div>

              {contact.jobTitle && (
                <p className="text-sm font-semibold text-[#ff4d00] tracking-wide">{contact.jobTitle}</p>
              )}

              {contact.company && (
                <p className="text-sm text-[#fafaf9]/50 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#fafaf9]/20" />
                  <span>{contact.company}</span>
                </p>
              )}
            </div>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-2.5 mt-6 pt-5 border-t border-white/[0.08]">
            {contact.email && (
              <motion.a
                href={`mailto:${contact.email}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2.5 bg-[#ff4d00] hover:bg-[#ff6a2f] text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-[#ff4d00]/20 flex items-center gap-2"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Email</span>
              </motion.a>
            )}

            {contact.phone && (
              <motion.a
                href={`tel:${contact.phone}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-[#fafaf9] text-xs font-bold rounded-xl transition-all border border-white/[0.08] flex items-center gap-2"
              >
                <Phone className="w-3.5 h-3.5 text-[#10b981]" />
                <span>Call Phone</span>
              </motion.a>
            )}

            {isAuthenticated && (
              <motion.button
                id={`edit-detail-modal-btn-${contact.id}`}
                onClick={() => {
                  onClose();
                  onEdit(contact);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-[#fafaf9] text-xs font-bold rounded-xl transition-all border border-white/[0.08] flex items-center gap-2"
              >
                <Edit3 className="w-3.5 h-3.5 text-[#fafaf9]/60" />
                <span>Edit Contact</span>
              </motion.button>
            )}

            {isAuthenticated && showConfirmDelete ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 ml-auto bg-rose-500/10 border border-rose-500/20 p-2 rounded-2xl"
              >
                <span className="text-[11px] font-bold text-rose-300 px-2">Confirm delete?</span>
                <button
                  id={`confirm-delete-detail-btn-${contact.id}`}
                  onClick={() => {
                    onDelete(contact.id);
                    setShowConfirmDelete(false);
                    onClose();
                  }}
                  className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white text-xs font-bold rounded-xl transition-colors"
                >
                  Yes, Delete
                </button>
                <button
                  id={`cancel-delete-detail-btn-${contact.id}`}
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] text-[#fafaf9] text-xs font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              isAuthenticated && (
                <motion.button
                  id={`delete-detail-modal-btn-${contact.id}`}
                  onClick={() => setShowConfirmDelete(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold rounded-xl transition-all border border-rose-500/20 ml-auto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </motion.button>
              )
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          {/* Category & Tags */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white/[0.03] p-4 rounded-2xl border border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <span className="text-xs text-[#fafaf9]/50 font-semibold uppercase tracking-wider">Category</span>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#ff4d00]/10 text-[#ff4d00] border border-[#ff4d00]/20">
                {contact.category}
              </span>
            </div>

            {contact.tags && contact.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-[#fafaf9]/30" />
                {contact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.04] text-[#fafaf9]/60 border border-white/[0.08]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            {contact.email && (
              <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#fafaf9]/50 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#ff4d00]" /> Email Address
                  </span>
                  <motion.button
                    id={`copy-email-btn-${contact.id}`}
                    onClick={() => handleCopy(contact.email, 'email')}
                    className="p-1.5 text-[#fafaf9]/40 hover:text-[#fafaf9] hover:bg-white/[0.06] rounded-lg transition-colors"
                    title="Copy Email"
                    whileTap={{ scale: 0.9 }}
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-3.5 h-3.5 text-[#10b981]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </motion.button>
                </div>
                <p className="text-sm font-semibold text-[#fafaf9] select-all">{contact.email}</p>
              </div>
            )}

            {/* Phone */}
            {contact.phone && (
              <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[#fafaf9]/50 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#10b981]" /> Phone Number
                  </span>
                  <motion.button
                    id={`copy-phone-btn-${contact.id}`}
                    onClick={() => handleCopy(contact.phone, 'phone')}
                    className="p-1.5 text-[#fafaf9]/40 hover:text-[#fafaf9] hover:bg-white/[0.06] rounded-lg transition-colors"
                    title="Copy Phone"
                    whileTap={{ scale: 0.9 }}
                  >
                    {copiedField === 'phone' ? (
                      <Check className="w-3.5 h-3.5 text-[#10b981]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </motion.button>
                </div>
                <p className="text-sm font-semibold text-[#fafaf9] select-all">{contact.phone}</p>
              </div>
            )}

            {/* Address */}
            {contact.address && (
              <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.08] space-y-2 md:col-span-2">
                <span className="text-[11px] text-[#fafaf9]/50 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#f43f5e]" /> Address
                </span>
                <p className="text-sm text-[#fafaf9]/80">{contact.address}</p>
              </div>
            )}

            {/* Website & LinkedIn */}
            {contact.website && (
              <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.08] space-y-2">
                <span className="text-[11px] text-[#fafaf9]/50 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#8b5cf6]" /> Website
                </span>
                <a
                  href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-[#ff4d00] hover:underline block truncate"
                >
                  {contact.website}
                </a>
              </div>
            )}

            {contact.linkedIn && (
              <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.08] space-y-2">
                <span className="text-[11px] text-[#fafaf9]/50 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-[#3b82f6]" /> LinkedIn
                </span>
                <a
                  href={contact.linkedIn.startsWith('http') ? contact.linkedIn : `https://${contact.linkedIn}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-[#ff4d00] hover:underline block truncate"
                >
                  {contact.linkedIn}
                </a>
              </div>
            )}
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className="p-5 bg-white/[0.02] rounded-2xl border border-white/[0.08] space-y-3">
              <h4 className="text-xs font-bold text-[#fafaf9]/70 uppercase tracking-widest flex items-center gap-2">
                <FileText className="w-3.5 h-3.5 text-[#ff4d00]" /> Relationship Notes
              </h4>
              <p className="text-sm text-[#fafaf9]/70 leading-relaxed whitespace-pre-wrap">
                {contact.notes}
              </p>
            </div>
          )}

          {/* Custom Fields */}
          {contact.customFields && contact.customFields.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-[#fafaf9]/50 uppercase tracking-widest">
                Custom Attributes
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contact.customFields.map((field) => (
                  <div
                    key={field.id}
                    className="p-3.5 bg-white/[0.02] rounded-xl border border-white/[0.08] text-xs space-y-1"
                  >
                    <span className="text-[#fafaf9]/40 block text-[10px] uppercase tracking-wider">{field.label}</span>
                    <span className="font-semibold text-[#fafaf9]">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interaction Timeline / Activity History */}
          <div className="space-y-4 pt-4 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#fafaf9] flex items-center gap-2.5" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)' }}>
                  <Clock className="w-4 h-4 text-[#ff4d00]" /> Interaction History
                </h4>
                <p className="text-xs text-[#fafaf9]/40 mt-1">Log calls, emails, meetings, and follow-ups</p>
              </div>

              <motion.button
                id="toggle-add-log-btn"
                onClick={() => setShowAddLog(!showAddLog)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-[#ff4d00] text-xs font-bold rounded-xl border border-[#ff4d00]/20 flex items-center gap-2 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Activity</span>
              </motion.button>
            </div>

            {/* Add Log Form */}
            <AnimatePresence>
              {showAddLog && (
                <motion.form
                  id="add-interaction-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onSubmit={handleCreateInteraction}
                  className="p-5 bg-white/[0.03] rounded-2xl border border-white/[0.08] space-y-4 overflow-hidden"
                >
                  <div className="flex items-center gap-3">
                    <label className="text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">Type</label>
                    <select
                      id="interaction-type-select"
                      value={logType}
                      onChange={(e) => setLogType(e.target.value as InteractionNote['type'])}
                      className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30"
                    >
                      <option value="Call">Call</option>
                      <option value="Email">Email</option>
                      <option value="Meeting">Meeting</option>
                      <option value="Note">Note</option>
                      <option value="Follow-up">Follow-up</option>
                    </select>
                  </div>

                  <div>
                    <input
                      id="interaction-summary-input"
                      type="text"
                      placeholder="Summary (e.g., Scheduled Q4 intro call)..."
                      value={logSummary}
                      onChange={(e) => {
                        setLogSummary(e.target.value);
                        if (logError) setLogError(null);
                      }}
                      className={`w-full bg-[#0a0a0a] border rounded-xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 transition-all ${
                        logError
                          ? 'border-rose-500/50 focus:ring-rose-500/30 bg-rose-500/5'
                          : 'border-white/[0.08] focus:ring-[#ff4d00]/30'
                      }`}
                    />
                    {logError && (
                      <p className="text-[11px] text-rose-400 mt-2 flex items-center gap-1.5 font-medium">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{logError}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <textarea
                      id="interaction-details-input"
                      placeholder="Additional notes / action items (optional)..."
                      value={logDetails}
                      onChange={(e) => setLogDetails(e.target.value)}
                      rows={2}
                      className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-1">
                    <button
                      id="cancel-log-btn"
                      type="button"
                      onClick={() => setShowAddLog(false)}
                      className="px-4 py-2 text-xs text-[#fafaf9]/50 hover:text-[#fafaf9] font-medium"
                    >
                      Cancel
                    </button>
                    <motion.button
                      id="submit-log-btn"
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-5 py-2.5 bg-[#ff4d00] hover:bg-[#ff6a2f] text-white text-xs font-bold rounded-xl shadow-lg shadow-[#ff4d00]/20 transition-all"
                    >
                      Save Log
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Interaction List */}
            {contact.interactions && contact.interactions.length > 0 ? (
              <div className="space-y-3">
                <AnimatePresence>
                  {contact.interactions.map((note) => (
                    <motion.div
                      key={note.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="p-4 bg-white/[0.02] rounded-2xl border border-white/[0.08] flex items-start justify-between gap-4 text-xs group"
                    >
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg border ${getLogTypeBadge(
                              note.type
                            )}`}
                          >
                            {note.type}
                          </span>
                          <span className="text-[11px] text-[#fafaf9]/40">
                            {new Date(note.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <p className="font-semibold text-[#fafaf9]">{note.summary}</p>
                        {note.details && (
                          <p className="text-[#fafaf9]/50 text-[11px] leading-relaxed">{note.details}</p>
                        )}
                      </div>

                      <motion.button
                        id={`delete-interaction-${note.id}`}
                        onClick={() => onDeleteInteraction(contact.id, note.id)}
                        className="p-2 text-[#fafaf9]/20 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                        title="Delete log"
                        whileTap={{ scale: 0.9 }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-10 bg-white/[0.02] rounded-2xl border border-dashed border-white/[0.08]">
                <Clock className="w-7 h-7 text-[#fafaf9]/15 mx-auto mb-2" />
                <p className="text-xs text-[#fafaf9]/40 font-medium">No interactions logged yet</p>
                <p className="text-[11px] text-[#fafaf9]/25 mt-1">Click 'Log Activity' to record calls or meetings.</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
