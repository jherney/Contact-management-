import React from 'react';
import { Star, Mail, Phone, Edit3, Trash2, Building2, Clock } from 'lucide-react';
import { Contact } from '../types';
import { getInitials, formatRelativeTime } from '../utils/contactUtils';

interface ContactTableRowProps {
  contact: Contact;
  onSelect: (contact: Contact) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onEdit: (contact: Contact, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const ContactTableRow: React.FC<ContactTableRowProps> = ({
  contact,
  onSelect,
  onToggleFavorite,
  onEdit,
  onDelete
}) => {
  const initials = getInitials(contact.firstName, contact.lastName);

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Work':
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30';
      case 'Client':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'VIP':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'Family':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'Personal':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    }
  };

  return (
    <tr
      id={`contact-row-${contact.id}`}
      onClick={() => onSelect(contact)}
      className="group hover:bg-slate-800/60 border-b border-slate-800/80 transition-colors cursor-pointer text-xs"
    >
      {/* Star */}
      <td className="py-3 px-4 w-10 text-center" onClick={(e) => e.stopPropagation()}>
        <button
          id={`favorite-row-btn-${contact.id}`}
          onClick={(e) => onToggleFavorite(contact.id, e)}
          className="p-1 rounded hover:bg-slate-700/50 text-slate-500 hover:text-amber-400"
        >
          <Star
            className={`w-4 h-4 ${
              contact.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-500'
            }`}
          />
        </button>
      </td>

      {/* Name & Title */}
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          {contact.avatarUrl ? (
            <img
              src={contact.avatarUrl}
              alt={`${contact.firstName} ${contact.lastName}`}
              className="w-9 h-9 rounded-lg object-cover ring-1 ring-slate-700 flex-shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className={`w-9 h-9 rounded-lg ${
                contact.avatarBgColor || 'bg-indigo-600'
              } flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-inner`}
            >
              {initials}
            </div>
          )}
          <div>
            <div className="font-semibold text-slate-100 group-hover:text-indigo-300 transition-colors text-sm">
              {contact.firstName} {contact.lastName}
            </div>
            {contact.jobTitle && (
              <div className="text-slate-400 text-[11px]">{contact.jobTitle}</div>
            )}
          </div>
        </div>
      </td>

      {/* Company */}
      <td className="py-3 px-4 text-slate-300 hidden md:table-cell">
        {contact.company ? (
          <div className="flex items-center gap-1.5 truncate">
            <Building2 className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="truncate">{contact.company}</span>
          </div>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </td>

      {/* Category */}
      <td className="py-3 px-4">
        <span
          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
            contact.category
          )}`}
        >
          {contact.category}
        </span>
      </td>

      {/* Contact Info */}
      <td className="py-3 px-4 hidden lg:table-cell">
        <div className="space-y-0.5">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-slate-300 hover:text-indigo-400 truncate"
            >
              <Mail className="w-3 h-3 text-slate-500" />
              <span className="truncate max-w-[180px]">{contact.email}</span>
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-slate-400 hover:text-indigo-400 truncate"
            >
              <Phone className="w-3 h-3 text-slate-500" />
              <span className="truncate">{contact.phone}</span>
            </a>
          )}
        </div>
      </td>

      {/* Last Contacted */}
      <td className="py-3 px-4 text-slate-400 text-[11px] hidden xl:table-cell">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-500" />
          {formatRelativeTime(contact.lastContactedAt)}
        </div>
      </td>

      {/* Actions */}
      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          <button
            id={`edit-row-btn-${contact.id}`}
            onClick={(e) => onEdit(contact, e)}
            title="Edit contact"
            className="p-1.5 rounded-lg hover:bg-slate-700/80 text-slate-400 hover:text-white transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            id={`delete-row-btn-${contact.id}`}
            onClick={(e) => onDelete(contact.id, e)}
            title="Delete contact"
            className="p-1.5 rounded-lg hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
};
