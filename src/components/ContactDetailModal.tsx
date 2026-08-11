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
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'Email':
        return 'bg-violet-500/15 text-violet-300 border-violet-500/30';
      case 'Meeting':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'Follow-up':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  return (
    <div
      id="contact-detail-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="contact-detail-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-slate-100"
      >
        {/* Header / Banner */}
        <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 border-b border-slate-800 flex-shrink-0">
          <button
            id="close-detail-modal-button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {contact.avatarUrl ? (
              <img
                src={contact.avatarUrl}
                alt={`${contact.firstName} ${contact.lastName}`}
                className="w-20 h-20 rounded-2xl object-cover ring-4 ring-slate-700/80 shadow-lg flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className={`w-20 h-20 rounded-2xl ${
                  contact.avatarBgColor || 'bg-indigo-600'
                } flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-slate-700/80 flex-shrink-0`}
              >
                {initials}
              </div>
            )}

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {contact.firstName} {contact.lastName}
                </h2>
                <button
                  id={`toggle-fav-detail-${contact.id}`}
                  onClick={() => onToggleFavorite(contact.id)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400"
                >
                  <Star
                    className={`w-5 h-5 ${
                      contact.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-500'
                    }`}
                  />
                </button>
              </div>

              {contact.jobTitle && (
                <p className="text-sm font-medium text-indigo-300">{contact.jobTitle}</p>
              )}

              {contact.company && (
                <p className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>{contact.company}</span>
                </p>
              )}
            </div>
          </div>

          {/* Quick Primary Actions */}
          <div className="flex flex-wrap items-center gap-2 mt-5 pt-4 border-t border-slate-800/80">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Email</span>
              </a>
            )}

            {contact.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 border border-slate-700"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Call Phone</span>
              </a>
            )}

            <button
              id={`edit-detail-modal-btn-${contact.id}`}
              onClick={() => {
                onClose();
                onEdit(contact);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 border border-slate-700"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              <span>Edit Contact</span>
            </button>

            {showConfirmDelete ? (
              <div className="flex items-center gap-2 ml-auto bg-rose-950/60 border border-rose-800/60 p-1.5 rounded-xl">
                <span className="text-[11px] font-semibold text-rose-200 px-1">
                  Confirm delete?
                </span>
                <button
                  id={`confirm-delete-detail-btn-${contact.id}`}
                  onClick={() => {
                    onDelete(contact.id);
                    setShowConfirmDelete(false);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                  Yes, Delete
                </button>
                <button
                  id={`cancel-delete-detail-btn-${contact.id}`}
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                id={`delete-detail-modal-btn-${contact.id}`}
                onClick={() => setShowConfirmDelete(true)}
                className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 border border-rose-800/40 ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Category & Tags */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-medium">Category:</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                {contact.category}
              </span>
            </div>

            {contact.tags && contact.tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-slate-500" />
                {contact.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
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
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email Address
                  </span>
                  <button
                    id={`copy-email-btn-${contact.id}`}
                    onClick={() => handleCopy(contact.email, 'email')}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copy Email"
                  >
                    {copiedField === 'email' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-sm font-semibold text-slate-100 select-all">{contact.email}</p>
              </div>
            )}

            {/* Phone */}
            {contact.phone && (
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> Phone Number
                  </span>
                  <button
                    id={`copy-phone-btn-${contact.id}`}
                    onClick={() => handleCopy(contact.phone, 'phone')}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copy Phone"
                  >
                    {copiedField === 'phone' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <p className="text-sm font-semibold text-slate-100 select-all">{contact.phone}</p>
              </div>
            )}

            {/* Address */}
            {contact.address && (
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 space-y-1 md:col-span-2">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" /> Address
                </span>
                <p className="text-xs text-slate-200">{contact.address}</p>
              </div>
            )}

            {/* Website & LinkedIn */}
            {contact.website && (
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" /> Website
                </span>
                <a
                  href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-indigo-400 hover:underline truncate block"
                >
                  {contact.website}
                </a>
              </div>
            )}

            {contact.linkedIn && (
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
                  <Linkedin className="w-3.5 h-3.5 text-blue-400" /> LinkedIn
                </span>
                <a
                  href={contact.linkedIn.startsWith('http') ? contact.linkedIn : `https://${contact.linkedIn}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-indigo-400 hover:underline truncate block"
                >
                  {contact.linkedIn}
                </a>
              </div>
            )}
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className="p-4 bg-slate-800/30 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" /> Relationship Notes
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {contact.notes}
              </p>
            </div>
          )}

          {/* Custom Fields */}
          {contact.customFields && contact.customFields.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Custom Fields
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {contact.customFields.map((field) => (
                  <div
                    key={field.id}
                    className="p-2.5 bg-slate-800/40 rounded-lg border border-slate-800 text-xs"
                  >
                    <span className="text-slate-400 block text-[10px]">{field.label}</span>
                    <span className="font-semibold text-slate-200">{field.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interaction Timeline / Activity History */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-400" /> Interaction History
                </h4>
                <p className="text-xs text-slate-400">Log calls, emails, meetings, and follow-ups</p>
              </div>

              <button
                id="toggle-add-log-btn"
                onClick={() => setShowAddLog(!showAddLog)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-semibold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Activity</span>
              </button>
            </div>

            {/* Add Log Form */}
            {showAddLog && (
              <form
                id="add-interaction-form"
                onSubmit={handleCreateInteraction}
                className="p-4 bg-slate-800/80 rounded-xl border border-slate-700 space-y-3"
              >
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-300 font-medium">Type:</label>
                  <select
                    id="interaction-type-select"
                    value={logType}
                    onChange={(e) => setLogType(e.target.value as InteractionNote['type'])}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                    className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 transition-all ${
                      logError
                        ? 'border-rose-500 focus:ring-rose-500/50 bg-rose-950/20'
                        : 'border-slate-700 focus:ring-indigo-500'
                    }`}
                  />
                  {logError && (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-medium">
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
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    id="cancel-log-btn"
                    type="button"
                    onClick={() => setShowAddLog(false)}
                    className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    id="submit-log-btn"
                    type="submit"
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow"
                  >
                    Save Log
                  </button>
                </div>
              </form>
            )}

            {/* Interaction List */}
            {contact.interactions && contact.interactions.length > 0 ? (
              <div className="space-y-2.5">
                {contact.interactions.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 bg-slate-800/40 rounded-xl border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getLogTypeBadge(
                            note.type
                          )}`}
                        >
                          {note.type}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(note.date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-200">{note.summary}</p>
                      {note.details && (
                        <p className="text-slate-400 text-[11px] leading-relaxed">{note.details}</p>
                      )}
                    </div>

                    <button
                      id={`delete-interaction-${note.id}`}
                      onClick={() => onDeleteInteraction(contact.id, note.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete log"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-800/20 rounded-xl border border-dashed border-slate-800">
                <Clock className="w-6 h-6 text-slate-600 mx-auto mb-1" />
                <p className="text-xs text-slate-400 font-medium">No interactions logged yet</p>
                <p className="text-[11px] text-slate-500">Click 'Log Activity' to record calls or meetings.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
