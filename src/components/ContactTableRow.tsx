import React from 'react';
import { Star, Mail, Phone, Edit3, Trash2, Building2, Clock } from 'lucide-react';
import { Contact } from '../types';
import { getInitials, formatRelativeTime } from '../utils/contactUtils';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

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
  const { isAuthenticated } = useAuth();
  const initials = getInitials(contact.firstName, contact.lastName);

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Work':
        return 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20';
      case 'Client':
        return 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20';
      case 'VIP':
        return 'bg-[#ff4d00]/10 text-[#ff4d00] border-[#ff4d00]/20';
      case 'Family':
        return 'bg-[#f43f5e]/10 text-[#f43f5e] border-[#f43f5e]/20';
      case 'Personal':
        return 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20';
      default:
        return 'bg-white/[0.06] text-[#fafaf9]/60 border-white/[0.08]';
    }
  };

  return (
    <motion.tr
      id={`contact-row-${contact.id}`}
      onClick={() => onSelect(contact)}
      className="group hover:bg-white/[0.02] border-b border-white/[0.06] transition-colors cursor-pointer text-xs"
      whileHover={{ backgroundColor: 'rgba(255, 77, 0, 0.02)' }}
    >
      {/* Star */}
      <td className="py-4 px-5 w-12 text-center" onClick={(e) => e.stopPropagation()}>
        <motion.button
          id={`favorite-row-btn-${contact.id}`}
          onClick={(e) => onToggleFavorite(contact.id, e)}
          className="p-2 rounded-xl hover:bg-white/[0.06] text-[#fafaf9]/30 hover:text-[#ff4d00] transition-colors"
          whileTap={{ scale: 0.9 }}
        >
          <Star
            className={`w-4 h-4 ${
              contact.isFavorite ? 'fill-[#ff4d00] text-[#ff4d00]' : 'text-[#fafaf9]/30'
            }`}
          />
        </motion.button>
      </td>

      {/* Name & Title */}
      <td className="py-4 px-5 min-w-0 flex-1">
        <div className="flex items-center gap-3.5">
          {contact.avatarUrl ? (
            <img
              src={contact.avatarUrl}
              alt={`${contact.firstName} ${contact.lastName}`}
              className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/[0.08] flex-shrink-0"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className={`w-10 h-10 rounded-xl ${
                contact.avatarBgColor || 'bg-[#ff4d00]'
              } flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-md`}
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {initials}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-[#fafaf9] group-hover:text-[#ff4d00] transition-colors text-sm truncate" style={{ fontFamily: 'var(--font-display)' }}>
              {contact.firstName} {contact.lastName}
            </div>
            {contact.jobTitle && (
              <div className="text-[#fafaf9]/50 text-[11px] mt-0.5 tracking-wide truncate">{contact.jobTitle}</div>
            )}
          </div>
        </div>
      </td>

      {/* Company */}
      <td className="py-4 px-5 min-w-0 hidden md:table-cell">
        {contact.company ? (
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-[#fafaf9]/20 flex-shrink-0" />
            <span className="truncate" title={contact.company}>{contact.company}</span>
          </div>
        ) : (
          <span className="text-[#fafaf9]/20">—</span>
        )}
      </td>

      {/* Category */}
      <td className="py-4 px-5 min-w-[110px]">
        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${getCategoryBadgeClass(
            contact.category
          )}`}
        >
          {contact.category}
        </span>
      </td>

      {/* Contact Info */}
      <td className="py-4 px-5 min-w-0 hidden lg:table-cell">
        <div className="space-y-1.5">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-[#fafaf9]/60 hover:text-[#ff4d00] truncate transition-colors"
            >
              <Mail className="w-3 h-3 text-[#fafaf9]/20 flex-shrink-0" />
              <span className="truncate max-w-[160px]" title={contact.email}>{contact.email}</span>
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2 text-[#fafaf9]/50 hover:text-[#ff4d00] truncate transition-colors"
            >
              <Phone className="w-3 h-3 text-[#fafaf9]/20 flex-shrink-0" />
              <span className="truncate max-w-[160px]" title={contact.phone}>{contact.phone}</span>
            </a>
          )}
        </div>
      </td>

      {/* Last Contacted */}
      <td className="py-4 px-5 text-[#fafaf9]/40 text-[11px] min-w-0 hidden xl:table-cell">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-[#fafaf9]/20 flex-shrink-0" />
          <span className="truncate">{formatRelativeTime(contact.lastContactedAt)}</span>
        </div>
      </td>

      {/* Actions */}
      <td className="py-4 px-5 text-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-end gap-1">
          {isAuthenticated && (
            <>
              <motion.button
                id={`edit-row-btn-${contact.id}`}
                onClick={(e) => onEdit(contact, e)}
                title="Edit contact"
                className="p-2 rounded-xl hover:bg-white/[0.06] text-[#fafaf9]/40 hover:text-[#fafaf9] transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </motion.button>
              <motion.button
                id={`delete-row-btn-${contact.id}`}
                onClick={(e) => onDelete(contact.id, e)}
                title="Delete contact"
                className="p-2 rounded-xl hover:bg-rose-500/10 text-[#fafaf9]/40 hover:text-rose-400 transition-colors"
                whileTap={{ scale: 0.9 }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </motion.button>
            </>
          )}
        </div>
      </td>
    </motion.tr>
  );
};
