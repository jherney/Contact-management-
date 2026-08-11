import React from 'react';
import {
  Star,
  Mail,
  Phone,
  Building2,
  Clock,
  MoreVertical,
  ExternalLink,
  Edit3,
  Trash2,
  MessageSquare
} from 'lucide-react';
import { Contact } from '../types';
import { getInitials, formatRelativeTime } from '../utils/contactUtils';

interface ContactCardProps {
  contact: Contact;
  onSelect: (contact: Contact) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onEdit: (contact: Contact, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
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
    <div
      id={`contact-card-${contact.id}`}
      onClick={() => onSelect(contact)}
      className="group relative bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:shadow-indigo-950/20 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between"
    >
      {/* Top row: Category & Favorite */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
              contact.category
            )}`}
          >
            {contact.category}
          </span>

          <div className="flex items-center gap-1">
            <button
              id={`favorite-btn-${contact.id}`}
              onClick={(e) => onToggleFavorite(contact.id, e)}
              title={contact.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className="p-2 sm:p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
            >
              <Star
                className={`w-4 h-4 ${
                  contact.isFavorite
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-500 group-hover:text-slate-400'
                }`}
              />
            </button>

            <button
              id={`edit-card-btn-${contact.id}`}
              onClick={(e) => onEdit(contact, e)}
              title="Edit contact"
              className="p-2 sm:p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>

            <button
              id={`delete-card-btn-${contact.id}`}
              onClick={(e) => onDelete(contact.id, e)}
              title="Delete contact"
              className="p-2 sm:p-1.5 rounded-lg hover:bg-rose-950/50 text-slate-400 hover:text-rose-400 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Main Info: Avatar & Name */}
        <div className="flex items-start gap-3 mb-4">
          {contact.avatarUrl ? (
            <img
              src={contact.avatarUrl}
              alt={`${contact.firstName} ${contact.lastName}`}
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-slate-700/60 flex-shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className={`w-12 h-12 rounded-xl ${
                contact.avatarBgColor || 'bg-indigo-600'
              } flex items-center justify-center text-white font-bold text-base shadow-inner ring-1 ring-white/10 flex-shrink-0`}
            >
              {initials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-100 text-base leading-tight truncate group-hover:text-indigo-300 transition-colors">
              {contact.firstName} {contact.lastName}
            </h3>
            {contact.jobTitle && (
              <p className="text-xs font-medium text-slate-300 truncate mt-0.5">
                {contact.jobTitle}
              </p>
            )}
            {contact.company && (
              <p className="text-xs text-slate-400 truncate flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-slate-500 flex-shrink-0" />
                <span className="truncate">{contact.company}</span>
              </p>
            )}
          </div>
        </div>

        {/* Contact Methods List */}
        <div className="space-y-1.5 py-2 border-t border-slate-800/80 text-xs">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-slate-300 hover:text-indigo-400 truncate py-1 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{contact.email}</span>
            </a>
          )}

          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-slate-300 hover:text-indigo-400 truncate py-1 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="truncate">{contact.phone}</span>
            </a>
          )}
        </div>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {contact.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60"
              >
                #{tag}
              </span>
            ))}
            {contact.tags.length > 3 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400">
                +{contact.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer: Activity timestamp */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500 font-medium">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-500" />
          Last log: {formatRelativeTime(contact.lastContactedAt)}
        </span>

        <span className="text-indigo-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-semibold">
          View Details
        </span>
      </div>
    </div>
  );
};
