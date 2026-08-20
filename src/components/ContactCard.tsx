import React, { useMemo } from 'react';
import {
  Star,
  Mail,
  Phone,
  Building2,
  Clock,
  ExternalLink,
  Edit3,
  Trash2
} from 'lucide-react';
import { Contact } from '../types';
import { getInitials, formatRelativeTime } from '../utils/contactUtils';
import { useAuth } from '../contexts/AuthContext';
import { useCrm } from '../contexts/CrmContext';
import { motion } from 'motion/react';

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
  const { isAuthenticated } = useAuth();
  const { leadScores } = useCrm();
  const initials = getInitials(contact.firstName, contact.lastName);

  const score = useMemo(() => leadScores.find((s) => s.contactId === contact.id), [leadScores, contact.id]);

  const getScoreBadgeClass = (tier: string) => {
    switch (tier) {
      case 'vip': return 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30';
      case 'hot': return 'bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/30';
      case 'warm': return 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30';
      case 'cold': return 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/30';
      default: return 'bg-white/[0.06] text-[#fafaf9]/60 border-white/[0.08]';
    }
  };

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
    <motion.div
      id={`contact-card-${contact.id}`}
      onClick={() => onSelect(contact)}
      className="group relative bg-[#141414] border border-white/[0.08] hover:border-[#ff4d00]/30 rounded-3xl p-6 transition-all duration-500 cursor-pointer flex flex-col justify-between card-interactive"
      whileHover={{ y: -6 }}
    >
      {/* Top row: Category & Favorite */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-4">
          <span
            className={`text-[10px] font-bold px-3 py-1 rounded-full border ${getCategoryBadgeClass(
              contact.category
            )}`}
          >
            {contact.category}
          </span>

          <div className="flex items-center gap-0.5">
            <motion.button
              id={`favorite-btn-${contact.id}`}
              onClick={(e) => onToggleFavorite(contact.id, e)}
              title={contact.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              className="p-2 rounded-xl hover:bg-white/[0.06] text-[#fafaf9]/40 hover:text-[#ff4d00] transition-colors"
              whileTap={{ scale: 0.9 }}
            >
              <Star
                className={`w-4 h-4 ${
                  contact.isFavorite
                    ? 'fill-[#ff4d00] text-[#ff4d00]'
                    : 'text-[#fafaf9]/30'
                }`}
              />
            </motion.button>

            {isAuthenticated && (
              <>
                <motion.button
                  id={`edit-card-btn-${contact.id}`}
                  onClick={(e) => onEdit(contact, e)}
                  title="Edit contact"
                  className="p-2 rounded-xl hover:bg-white/[0.06] text-[#fafaf9]/40 hover:text-[#fafaf9] transition-colors"
                  whileTap={{ scale: 0.9 }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </motion.button>

                <motion.button
                  id={`delete-card-btn-${contact.id}`}
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
        </div>

        {/* Main Info: Avatar & Name — Asymmetric layout */}
        <div className="flex items-start gap-4 mb-5">
          <div className="relative">
            {contact.avatarUrl ? (
              <img
                src={contact.avatarUrl}
                alt={`${contact.firstName} ${contact.lastName}`}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/[0.08] flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className={`w-14 h-14 rounded-2xl ${
                  contact.avatarBgColor || 'bg-[#ff4d00]'
                } flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-white/[0.08] flex-shrink-0`}
                style={{ fontFamily: 'var(--font-display)' }}
              >
                {initials}
              </div>
            )}
            {contact.isFavorite && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#ff4d00] rounded-full flex items-center justify-center">
                <Star className="w-2.5 h-2.5 fill-white text-white" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <h3 className="font-bold text-[#fafaf9] text-base leading-tight truncate group-hover:text-[#ff4d00] transition-colors" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)' }}>
              {contact.firstName} {contact.lastName}
            </h3>
            {contact.jobTitle && (
              <p className="text-xs font-medium text-[#fafaf9]/60 truncate mt-1 tracking-wide">
                {contact.jobTitle}
              </p>
            )}
            {contact.company && (
              <p className="text-xs text-[#fafaf9]/50 truncate flex items-center gap-1.5 mt-1.5">
                <Building2 className="w-3 h-3 text-[#fafaf9]/30 flex-shrink-0" />
                <span className="truncate">{contact.company}</span>
              </p>
            )}
          </div>
        </div>

        {/* Contact Methods */}
        <div className="space-y-2 py-3 border-t border-white/[0.06] text-xs">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2.5 text-[#fafaf9]/70 hover:text-[#ff4d00] truncate py-1 transition-colors group/link"
            >
              <Mail className="w-3.5 h-3.5 text-[#fafaf9]/30 group-hover/link:text-[#ff4d00] flex-shrink-0 transition-colors" />
              <span className="truncate">{contact.email}</span>
            </a>
          )}

          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-2.5 text-[#fafaf9]/70 hover:text-[#ff4d00] truncate py-1 transition-colors group/link"
            >
              <Phone className="w-3.5 h-3.5 text-[#fafaf9]/30 group-hover/link:text-[#ff4d00] flex-shrink-0 transition-colors" />
              <span className="truncate">{contact.phone}</span>
            </a>
          )}
        </div>

        {/* Tags */}
        {contact.tags && contact.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {contact.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2.5 py-1 rounded-lg bg-white/[0.04] text-[#fafaf9]/60 border border-white/[0.08] font-medium"
              >
                #{tag}
              </span>
            ))}
            {contact.tags.length > 3 && (
              <span className="text-[10px] px-2 py-1 rounded-lg bg-white/[0.04] text-[#fafaf9]/40 border border-white/[0.06]">
                +{contact.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-5 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-[#fafaf9]/40 font-medium">
        <span className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-[#fafaf9]/20" />
          {formatRelativeTime(contact.lastContactedAt)}
        </span>

        {isAuthenticated && score && (
          <span
            id={`lead-score-${contact.id}`}
            className={`text-[10px] px-2.5 py-1 rounded-lg border font-semibold ${getScoreBadgeClass(score.tier)}`}
          >
            {score.score} pts • {score.tier}
          </span>
        )}

        <span className="text-[#ff4d00] group-hover:translate-x-1 transition-transform flex items-center gap-1 font-semibold">
          View Details
          <ExternalLink className="w-3 h-3" />
        </span>
      </div>
    </motion.div>
  );
};
