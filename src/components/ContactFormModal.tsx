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
  Sparkles
} from 'lucide-react';
import { Contact, ContactCategory, CustomField } from '../types';
import { AVATAR_COLORS } from '../utils/contactUtils';

interface ContactFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>, existingId?: string) => void;
  initialContact?: Contact | null;
}

export const ContactFormModal: React.FC<ContactFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialContact
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
  const [avatarBgColor, setAvatarBgColor] = useState('bg-indigo-600');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [notes, setNotes] = useState('');

  // Tags state
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Custom fields state
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  useEffect(() => {
    if (initialContact) {
      setFirstName(initialContact.firstName || '');
      setLastName(initialContact.lastName || '');
      setEmail(initialContact.email || '');
      setPhone(initialContact.phone || '');
      setSecondaryPhone(initialContact.secondaryPhone || '');
      setCompany(initialContact.company || '');
      setJobTitle(initialContact.jobTitle || '');
      setCategory(initialContact.category || 'Work');
      setAvatarBgColor(initialContact.avatarBgColor || 'bg-indigo-600');
      setAvatarUrl(initialContact.avatarUrl || '');
      setIsFavorite(initialContact.isFavorite || false);
      setAddress(initialContact.address || '');
      setWebsite(initialContact.website || '');
      setLinkedIn(initialContact.linkedIn || '');
      setNotes(initialContact.notes || '');
      setTags(initialContact.tags || []);
      setCustomFields(initialContact.customFields || []);
    } else {
      // Reset defaults for new contact
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setSecondaryPhone('');
      setCompany('');
      setJobTitle('');
      setCategory('Work');
      setAvatarBgColor(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
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

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const formattedTag = tagInput.trim().replace(/^#/, '');
    if (formattedTag && !tags.includes(formattedTag)) {
      setTags([...tags, formattedTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddCustomField = () => {
    setCustomFields([
      ...customFields,
      { id: `cf-${Date.now()}`, label: 'New Label', value: '' }
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
    if (!firstName.trim()) return;

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
    <div
      id="contact-form-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        id="contact-form-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col text-slate-100"
      >
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            <span>{initialContact ? 'Edit Contact' : 'Create New Contact'}</span>
          </h2>
          <button
            id="close-form-modal-button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-xs">
          {/* Avatar Color & Favorite Toggle */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-800/40 rounded-xl border border-slate-800">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300 block">
                Avatar Background Color
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {AVATAR_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarBgColor(color)}
                    className={`w-6 h-6 rounded-lg ${color} ring-2 transition-all ${
                      avatarBgColor === color ? 'ring-white scale-110' : 'ring-transparent opacity-80'
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              id="form-favorite-toggle"
              type="button"
              onClick={() => setIsFavorite(!isFavorite)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isFavorite
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span>{isFavorite ? 'Starred Favorite' : 'Mark Favorite'}</span>
            </button>
          </div>

          {/* Name & Primary Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                First Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="contact-first-name-input"
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Last Name</label>
              <input
                id="contact-last-name-input"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Contact Methods */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-indigo-400" /> Email
              </label>
              <input
                id="contact-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane.doe@example.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-400" /> Primary Phone
              </label>
              <input
                id="contact-phone-input"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Company & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-1">
              <label className="block font-semibold text-slate-300 mb-1">Category</label>
              <select
                id="contact-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as ContactCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Work">Work</option>
                <option value="Client">Client</option>
                <option value="VIP">VIP</option>
                <option value="Family">Family</option>
                <option value="Personal">Personal</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Company</label>
              <input
                id="contact-company-input"
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Job Title</label>
              <input
                id="contact-jobtitle-input"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Product Manager"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Address & Social Links */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div>
              <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-rose-400" /> Address
              </label>
              <input
                id="contact-address-input"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Market St, San Francisco, CA"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" /> Website URL
                </label>
                <input
                  id="contact-website-input"
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Linkedin className="w-3.5 h-3.5 text-blue-400" /> LinkedIn Profile
                </label>
                <input
                  id="contact-linkedin-input"
                  type="text"
                  value={linkedIn}
                  onChange={(e) => setLinkedIn(e.target.value)}
                  placeholder="linkedin.com/in/username"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="block font-semibold text-slate-300 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-indigo-400" /> Tags
            </label>
            <div className="flex gap-2">
              <input
                id="contact-tag-input"
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                placeholder="Type tag & press Enter (e.g. Developer, Austin)..."
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                id="add-tag-btn"
                type="button"
                onClick={handleAddTag}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-xl"
              >
                Add Tag
              </button>
            </div>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700"
                  >
                    #{t}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(t)}
                      className="text-slate-400 hover:text-rose-400 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Relationship Notes */}
          <div className="space-y-1 pt-2 border-t border-slate-800">
            <label className="block font-semibold text-slate-300 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-indigo-400" /> Notes & Context
            </label>
            <textarea
              id="contact-notes-input"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Important details, meeting background, preferences..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Custom Fields Generator */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-300">Custom Attributes</label>
              <button
                id="add-custom-field-btn"
                type="button"
                onClick={handleAddCustomField}
                className="text-indigo-400 hover:text-indigo-300 font-semibold text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Custom Field
              </button>
            </div>

            {customFields.map((field) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Attribute Label"
                  value={field.label}
                  onChange={(e) => handleUpdateCustomField(field.id, 'label', e.target.value)}
                  className="w-1/3 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={field.value}
                  onChange={(e) => handleUpdateCustomField(field.id, 'value', e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveCustomField(field.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              id="cancel-contact-form-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 font-semibold"
            >
              Cancel
            </button>
            <button
              id="submit-contact-form-btn"
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-md transition-all"
            >
              {initialContact ? 'Save Changes' : 'Create Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
