import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Tag,
  User,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  FileText,
  Star,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Contact, ContactCategory, CustomField } from '../types';
import { AVATAR_COLORS } from '../utils/contactUtils';
import { validateContactFormData, findDuplicateContact, ContactValidationErrors } from '../utils/validation';
import { motion, AnimatePresence } from 'motion/react';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>, existingId?: string) => void;
  initialContact?: Contact | null;
  existingContacts?: Contact[];
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialContact,
  existingContacts = []
}) => {
  if (!isOpen) return null;

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [category, setCategory] = useState<ContactCategory>('Work');
  const [avatarBgColor, setAvatarBgColor] = useState('bg-[#ff4d00]');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<ContactValidationErrors>({});
  const [tagError, setTagError] = useState<string | null>(null);

  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  useEffect(() => {
    setErrors({});
    setTagError(null);

    if (initialContact) {
      setFirstName(initialContact.firstName || '');
      setLastName(initialContact.lastName || '');
      setEmail(initialContact.email || '');
      setPhone(initialContact.phone || '');
      setSecondaryPhone(initialContact.secondaryPhone || '');
      setCompany(initialContact.company || '');
      setJobTitle(initialContact.jobTitle || '');
      setCategory(initialContact.category || 'Work');
      setAvatarBgColor(initialContact.avatarBgColor || 'bg-[#ff4d00]');
      setAvatarUrl(initialContact.avatarUrl || '');
      setIsFavorite(initialContact.isFavorite || false);
      setAddress(initialContact.address || '');
      setWebsite(initialContact.website || '');
      setLinkedIn(initialContact.linkedIn || '');
      setNotes(initialContact.notes || '');
      setTags(initialContact.tags || []);
      setCustomFields(initialContact.customFields || []);
    } else {
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setSecondaryPhone('');
      setCompany('');
      setJobTitle('');
      setCategory('Work');
      setAvatarBgColor('bg-[#ff4d00]');
      setAvatarUrl('');
      setIsFavorite(false);
      setAddress('');
      setWebsite('');
      setLinkedIn('');
      setNotes('');
      setTags([]);
      setCustomFields([]);
    }
  }, [initialContact, isOpen]);

  const clearFieldError = (field: keyof ContactValidationErrors) => {
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    setTagError(null);

    const formattedTag = tagInput.trim().replace(/^#/, '');
    if (!formattedTag) return;

    if (formattedTag.length > 25) {
      setTagError('Tag name cannot exceed 25 characters.');
      return;
    }

    if (tags.some((t) => t.toLowerCase() === formattedTag.toLowerCase())) {
      setTagError('This tag has already been added.');
      return;
    }

    setTags([...tags, formattedTag]);
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddCustomField = () => {
    setCustomFields([
      ...customFields,
      { id: `cf-${Date.now()}`, label: 'Label', value: '' }
    ]);
  };

  const handleUpdateCustomField = (id: string, key: 'label' | 'value', val: string) => {
    setCustomFields(
      customFields.map((f) => (f.id === id ? { ...f, [key]: val } : f))
    );
  };

  const handleRemoveCustomField = (id: string) => {
    setCustomFields(customFields.filter((f) => f.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateContactFormData({
      firstName,
      lastName,
      company,
      jobTitle,
      email,
      phone,
      secondaryPhone,
      address,
      website,
      linkedIn,
      avatarUrl,
      notes,
      customFields
    });

    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    const dupCheck = findDuplicateContact(
      { firstName, lastName, email, phone },
      existingContacts,
      initialContact?.id
    );

    if (dupCheck.isDuplicate && dupCheck.message) {
      const field = dupCheck.field || 'firstName';
      setErrors({
        ...validation,
        [field]: dupCheck.message
      });
      return;
    }

    onSave(
      {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        secondaryPhone: secondaryPhone.trim() || undefined,
        company: company.trim(),
        jobTitle: jobTitle.trim(),
        category,
        avatarBgColor,
        avatarUrl: avatarUrl.trim() || undefined,
        isFavorite,
        address: address.trim() || undefined,
        website: website.trim() || undefined,
        linkedIn: linkedIn.trim() || undefined,
        notes: notes.trim() || undefined,
        tags,
        customFields: customFields.filter((f) => f.label.trim() && f.value.trim())
      },
      initialContact?.id
    );

    onClose();
  };

  return (
    <motion.div
      id="contact-form-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        id="contact-form-card"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-[#141414] border border-white/[0.08] rounded-[2rem] shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-[#fafaf9]"
      >
        {/* Decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff4d00] via-[#ff6a2f] to-[#ff4d00] opacity-80" />

        {/* Header */}
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#141414] px-6 sm:px-8 py-5 border-b border-white/[0.08] flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-3" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
            <User className="w-5 h-5 text-[#ff4d00]" />
            <span>{initialContact ? 'Edit Contact' : 'Create New Contact'}</span>
          </h2>
          <button
            id="close-form-modal-button"
            onClick={onClose}
            className="p-2 text-[#fafaf9]/40 hover:text-[#fafaf9] hover:bg-white/[0.06] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 text-xs">
          {/* General Error Banner */}
          {Object.keys(errors).length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs flex items-center gap-3"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Please review and correct the highlighted fields before saving.</span>
            </motion.div>
          )}

          {/* Avatar Color & Favorite Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white/[0.02] rounded-2xl border border-white/[0.08]">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-[#fafaf9]/50 uppercase tracking-widest block">
                Avatar Background Color
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <motion.button
                    key={color}
                    type="button"
                    onClick={() => setAvatarBgColor(color)}
                    className={`w-7 h-7 rounded-xl ${color} ring-2 transition-all ${
                      avatarBgColor === color ? 'ring-white scale-110' : 'ring-transparent opacity-70'
                    }`}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>
            </div>

            <motion.button
              id="form-favorite-toggle"
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`px-4 py-2.5 rounded-2xl border text-xs font-bold flex items-center gap-2 transition-all ${
                isFavorite
                  ? 'bg-[#ff4d00]/15 text-[#ff4d00] border-[#ff4d00]/30'
                  : 'bg-[#0a0a0a] text-[#fafaf9]/50 border-white/[0.08] hover:text-[#fafaf9]'
              }`}
              whileTap={{ scale: 0.95 }}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-[#ff4d00] text-[#ff4d00]' : ''}`} />
              <span>{isFavorite ? 'Starred Favorite' : 'Mark Favorite'}</span>
            </motion.button>
          </div>

          {/* Name & Primary Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">
                First Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="contact-first-name-input"
                type="text"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  clearFieldError('firstName');
                }}
                placeholder="Jane"
                className={`w-full bg-[#0a0a0a] border rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 transition-all ${
                  errors.firstName
                    ? 'border-rose-500/50 focus:ring-rose-500/30 bg-rose-500/5'
                    : 'border-white/[0.08] focus:ring-[#ff4d00]/30 focus:border-[#ff4d00]/30'
                }`}
              />
              {errors.firstName && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.firstName}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">Last Name</label>
              <input
                id="contact-last-name-input"
                type="text"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  clearFieldError('lastName');
                }}
                placeholder="Doe"
                className={`w-full bg-[#0a0a0a] border rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 transition-all ${
                  errors.lastName
                    ? 'border-rose-500/50 focus:ring-rose-500/30 bg-rose-500/5'
                    : 'border-white/[0.08] focus:ring-[#ff4d00]/30 focus:border-[#ff4d00]/30'
                }`}
              />
              {errors.lastName && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.lastName}</span>
                </p>
              )}
            </div>
          </div>

          {/* Contact Methods */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#ff4d00]" /> Email
              </label>
              <input
                id="contact-email-input"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError('email');
                }}
                placeholder="jane.doe@example.com"
                className={`w-full bg-[#0a0a0a] border rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 transition-all ${
                  errors.email
                    ? 'border-rose-500/50 focus:ring-rose-500/30 bg-rose-500/5'
                    : 'border-white/[0.08] focus:ring-[#ff4d00]/30 focus:border-[#ff4d00]/30'
                }`}
              />
              {errors.email && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#10b981]" /> Primary Phone
              </label>
              <input
                id="contact-phone-input"
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearFieldError('phone');
                }}
                placeholder="+1 (555) 000-0000"
                className={`w-full bg-[#0a0a0a] border rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 transition-all ${
                  errors.phone
                    ? 'border-rose-500/50 focus:ring-rose-500/30 bg-rose-500/5'
                    : 'border-white/[0.08] focus:ring-[#ff4d00]/30 focus:border-[#ff4d00]/30'
                }`}
              />
              {errors.phone && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Company & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1 space-y-1.5">
              <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">Category</label>
              <select
                id="contact-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as ContactCategory)}
                className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
              >
                <option value="Work">Work</option>
                <option value="Client">Client</option>
                <option value="VIP">VIP</option>
                <option value="Family">Family</option>
                <option value="Personal">Personal</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">Company</label>
              <input
                id="contact-company-input"
                type="text"
                value={company}
                onChange={(e) => {
                  setCompany(e.target.value);
                  clearFieldError('company');
                }}
                placeholder="Acme Corp"
                className={`w-full bg-[#0a0a0a] border rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 transition-all ${
                  errors.company
                    ? 'border-rose-500/50 focus:ring-rose-500/30 bg-rose-500/5'
                    : 'border-white/[0.08] focus:ring-[#ff4d00]/30 focus:border-[#ff4d00]/30'
                }`}
              />
              {errors.company && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.company}</span>
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">Job Title</label>
              <input
                id="contact-jobtitle-input"
                type="text"
                value={jobTitle}
                onChange={(e) => {
                  setJobTitle(e.target.value);
                  clearFieldError('jobTitle');
                }}
                placeholder="Product Manager"
                className={`w-full bg-[#0a0a0a] border rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 transition-all ${
                  errors.jobTitle
                    ? 'border-rose-500/50 focus:ring-rose-500/30 bg-rose-500/5'
                    : 'border-white/[0.08] focus:ring-[#ff4d00]/30 focus:border-[#ff4d00]/30'
                }`}
              />
              {errors.jobTitle && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.jobTitle}</span>
                </p>
              )}
            </div>
          </div>

          {/* Address & Social Links */}
          <div className="space-y-4 pt-2 border-t border-white/[0.08]">
            <div className="space-y-1.5">
              <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#f43f5e]" /> Address
              </label>
              <input
                id="contact-address-input"
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  clearFieldError('address');
                }}
                placeholder="123 Market St, San Francisco, CA"
                className={`w-full bg-[#0a0a0a] border rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 transition-all ${
                  errors.address
                    ? 'border-rose-500/50 focus:ring-rose-500/30 bg-rose-500/5'
                    : 'border-white/[0.08] focus:ring-[#ff4d00]/30 focus:border-[#ff4d00]/30'
                }`}
              />
              {errors.address && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.address}</span>
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-[#8b5cf6]" /> Website URL
                </label>
                <input
                  id="contact-website-input"
                  type="text"
                  value={website}
                  onChange={(e) => {
                    setWebsite(e.target.value);
                    clearFieldError('website');
                  }}
                  placeholder="https://example.com"
                  className={`w-full bg-[#0a0a0a] border rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 transition-all ${
                    errors.website
                      ? 'border-rose-500/50 focus:ring-rose-500/30 bg-rose-500/5'
                      : 'border-white/[0.08] focus:ring-[#ff4d00]/30 focus:border-[#ff4d00]/30'
                  }`}
                />
                {errors.website && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.website}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider flex items-center gap-2">
                  <Linkedin className="w-3.5 h-3.5 text-[#3b82f6]" /> LinkedIn Profile
                </label>
                <input
                  id="contact-linkedin-input"
                  type="text"
                  value={linkedIn}
                  onChange={(e) => {
                    setLinkedIn(e.target.value);
                    clearFieldError('linkedIn');
                  }}
                  placeholder="linkedin.com/in/username"
                  className={`w-full bg-[#0a0a0a] border rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 transition-all ${
                    errors.linkedIn
                      ? 'border-rose-500/50 focus:ring-rose-500/30 bg-rose-500/5'
                      : 'border-white/[0.08] focus:ring-[#ff4d00]/30 focus:border-[#ff4d00]/30'
                  }`}
                />
                {errors.linkedIn && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{errors.linkedIn}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-[#ff4d00]" /> Avatar Image URL (Optional)
              </label>
              <input
                id="contact-avatar-url-input"
                type="text"
                value={avatarUrl}
                onChange={(e) => {
                  setAvatarUrl(e.target.value);
                  clearFieldError('avatarUrl');
                }}
                placeholder="https://images.unsplash.com/photo-..."
                className={`w-full bg-[#0a0a0a] border rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 transition-all ${
                  errors.avatarUrl
                    ? 'border-rose-500/50 focus:ring-rose-500/30 bg-rose-500/5'
                    : 'border-white/[0.08] focus:ring-[#ff4d00]/30 focus:border-[#ff4d00]/30'
                }`}
              />
              {errors.avatarUrl && (
                <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{errors.avatarUrl}</span>
                </p>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3 pt-2 border-t border-white/[0.08]">
            <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-[#ff4d00]" /> Tags
            </label>
            <div className="flex gap-2.5">
              <input
                id="contact-tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => {
                  setTagInput(e.target.value);
                  setTagError(null);
                }}
                onKeyDown={handleAddTag}
                placeholder="Type tag & press Enter (e.g. Developer, Austin)..."
                className={`flex-1 bg-[#0a0a0a] border rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 transition-all ${
                  tagError
                    ? 'border-rose-500/50 focus:ring-rose-500/30 bg-rose-500/5'
                    : 'border-white/[0.08] focus:ring-[#ff4d00]/30 focus:border-[#ff4d00]/30'
                }`}
              />
              <motion.button
                id="add-tag-btn"
                type="button"
                onClick={handleAddTag}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-[#fafaf9] font-bold rounded-2xl transition-all"
              >
                Add Tag
              </motion.button>
            </div>
            {tagError && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{tagError}</span>
              </p>
            )}

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.04] text-[#fafaf9]/70 border border-white/[0.08] text-xs font-medium"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-[#fafaf9]/30 hover:text-rose-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Relationship Notes */}
          <div className="space-y-2 pt-2 border-t border-white/[0.08]">
            <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-3.5 h-3.5 text-[#ff4d00]" /> Notes & Context
            </label>
            <textarea
              id="contact-notes-input"
              rows={3}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                clearFieldError('notes');
              }}
              placeholder="Important details, meeting background, preferences..."
              className={`w-full bg-[#0a0a0a] border rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 transition-all resize-none ${
                errors.notes
                  ? 'border-rose-500/50 focus:ring-rose-500/30 bg-rose-500/5'
                  : 'border-white/[0.08] focus:ring-[#ff4d00]/30 focus:border-[#ff4d00]/30'
              }`}
            />
            {errors.notes && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.notes}</span>
              </p>
            )}
          </div>

          {/* Custom Fields Generator */}
          <div className="space-y-4 pt-2 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">Custom Attributes</label>
              <motion.button
                id="add-custom-field-btn"
                type="button"
                onClick={handleAddCustomField}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-[#ff4d00] hover:text-[#ff6a2f] font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add Custom Field
              </motion.button>
            </div>

            {errors.customFields && (
              <p className="text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.customFields}</span>
              </p>
            )}

            <AnimatePresence>
              {customFields.map((field) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2.5"
                >
                  <input
                    type="text"
                    placeholder="Attribute Label"
                    value={field.label}
                    onChange={(e) => {
                      handleUpdateCustomField(field.id, 'label', e.target.value);
                      clearFieldError('customFields');
                    }}
                    className="w-1/3 bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                  />
                  <input
                    type="text"
                    placeholder="Value"
                    value={field.value}
                    onChange={(e) => {
                      handleUpdateCustomField(field.id, 'value', e.target.value);
                      clearFieldError('customFields');
                    }}
                    className="flex-1 bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-2.5 text-xs text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                  />
                  <motion.button
                    type="button"
                    onClick={() => handleRemoveCustomField(field.id)}
                    whileTap={{ scale: 0.9 }}
                    className="p-2.5 text-[#fafaf9]/30 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Footer Submit */}
          <div className="pt-5 border-t border-white/[0.08] flex items-center justify-end gap-3">
            <button
              id="cancel-contact-form-btn"
              type="button"
              onClick={onClose}
              className="px-5 py-3 text-[#fafaf9]/50 hover:text-[#fafaf9] font-semibold transition-colors"
            >
              Cancel
            </button>
            <motion.button
              id="submit-contact-form-btn"
              type="submit"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-3 bg-[#ff4d00] hover:bg-[#ff6a2f] text-white font-bold rounded-2xl transition-all shadow-lg shadow-[#ff4d00]/20 text-sm tracking-wide"
            >
              {initialContact ? 'Save Changes' : 'Create Contact'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
