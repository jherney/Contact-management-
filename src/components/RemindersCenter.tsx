import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  Clock,
  CheckCircle,
  X,
  AlertCircle,
  Calendar,
  Repeat,
  PauseCircle,
  Trash2,
  Edit3,
  User
} from 'lucide-react';
import { Reminder, ReminderType, ReminderStatus, Contact } from '../types';
import { useCrm } from '../contexts/CrmContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface RemindersCenterProps {
  contacts: Contact[];
}

const REMINDER_TYPE_CONFIG: Record<ReminderType, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  follow_up: { label: 'Follow-up', icon: Clock, color: 'text-[#3b82f6]' },
  birthday: { label: 'Birthday', icon: Calendar, color: 'text-[#f43f5e]' },
  anniversary: { label: 'Anniversary', icon: Calendar, color: 'text-[#ff9500]' },
  custom: { label: 'Custom', icon: Bell, color: 'text-[#8b5cf6]' },
};

const STATUS_CONFIG: Record<ReminderStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'text-[#fafaf9]/60' },
  completed: { label: 'Completed', color: 'text-[#10b981]' },
  snoozed: { label: 'Snoozed', color: 'text-[#8b5cf6]' },
};

const RECURRENCE_OPTIONS = [
  { value: 'none', label: 'Once' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

const SNOOZE_OPTIONS = [
  { label: '30 minutes', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '3 hours', value: 180 },
  { label: '1 day', value: 1440 },
  { label: '3 days', value: 4320 },
];

export const RemindersCenter: React.FC<RemindersCenterProps> = ({ contacts }) => {
  const { reminders, dueReminders, addReminder, updateReminder, deleteReminder, snoozeReminder, completeReminder } = useCrm();
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [type, setType] = useState<ReminderType>('custom');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [remindAt, setRemindAt] = useState('');
  const [recurrence, setRecurrence] = useState('none');
  const [contactId, setContactId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const getContactName = (id?: string) => {
    if (!id) return null;
    const c = contacts.find((c) => c.id === id);
    return c ? `${c.firstName} ${c.lastName}` : null;
  };

  const activeReminders = reminders
    .filter((r) => r.status === 'active' || r.status === 'snoozed')
    .sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime());

  const completedReminders = reminders
    .filter((r) => r.status === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleOpenAdd = (presetType: ReminderType = 'custom') => {
    setEditingReminder(null);
    setType(presetType);
    setTitle('');
    setMessage('');
    setRemindAt('');
    setRecurrence('none');
    setContactId('');
    setError(null);
    setShowForm(true);
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setType(reminder.type);
    setTitle(reminder.title);
    setMessage(reminder.message || '');
    setRemindAt(reminder.remindAt ? new Date(reminder.remindAt).toISOString().slice(0, 16) : '');
    setRecurrence(reminder.recurrence || 'none');
    setContactId(reminder.contactId || '');
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !remindAt) {
      setError('Title and reminder time are required.');
      return;
    }
    setError(null);

    const reminderData: any = {
      title: title.trim(),
      message: message.trim() || undefined,
      remindAt: new Date(remindAt).toISOString(),
      recurrence: recurrence as any,
      contactId: contactId || undefined,
      type,
    };

    if (editingReminder) {
      await updateReminder(editingReminder.id, reminderData);
    } else {
      await addReminder(reminderData);
    }
    setShowForm(false);
  };

  const handleSnooze = async (reminder: Reminder, minutes: number) => {
    const until = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    await snoozeReminder(reminder.id, until);
  };

  const handleComplete = async (reminder: Reminder) => {
    await completeReminder(reminder.id);
  };

  const handleDelete = async (reminder: Reminder) => {
    if (window.confirm(`Delete reminder "${reminder.title}"?`)) {
      await deleteReminder(reminder.id);
    }
  };

  const quickAddFollowup = (contact?: Contact) => {
    setType('follow_up');
    setTitle(contact ? `Follow up with ${contact.firstName}` : 'New follow-up');
    setRemindAt(new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
    setContactId(contact?.id || '');
    setRecurrence('none');
    setMessage('');
    setError(null);
    setEditingReminder(null);
    setShowForm(true);
  };

  if (!isAuthenticated) {
    return (
      <div className="p-8 bg-[#141414] border border-white/[0.08] rounded-3xl text-center space-y-4">
        <Bell className="w-8 h-8 text-[#ff4d00] mx-auto" />
        <h3 className="text-lg font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)' }}>
          Sign in to manage reminders
        </h3>
        <p className="text-sm text-[#fafaf9]/50">Set automated reminders for follow-ups and important dates.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)' }}>
            Reminders
          </h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] text-[#fafaf9]/60 font-mono border border-white/[0.08]">
            {dueReminders.length} due
          </span>
          {dueReminders.length > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 font-mono border border-rose-500/20">
              {dueReminders.length} overdue
            </span>
          )}
        </div>

        <motion.button
          id="add-reminder-btn"
          onClick={() => handleOpenAdd('follow_up')}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2.5 bg-[#ff4d00] hover:bg-[#ff6a2f] text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-[#ff4d00]/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Reminder</span>
        </motion.button>
      </div>

      {/* Due Reminders Banner */}
      {dueReminders.length > 0 && (
        <motion.div
          id="due-reminders-banner"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-3"
        >
          <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
            <AlertCircle className="w-5 h-5" />
            <span>{dueReminders.length} reminder(s) due now</span>
          </div>
          <div className="space-y-2">
            {dueReminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between p-3 bg-[#141414] rounded-xl">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-rose-400" />
                  <div>
                    <p className="text-sm font-semibold text-[#fafaf9]">{r.title}</p>
                    {r.message && <p className="text-xs text-[#fafaf9]/60">{r.message}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => handleComplete(r)}
                    whileTap={{ scale: 0.95 }}
                    className="px-3 py-1.5 bg-[#10b981]/10 hover:bg-[#10b981]/20 text-[#10b981] text-xs font-semibold rounded-lg transition-colors"
                  >
                    <span>Done</span>
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Active Reminders */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-[#fafaf9] flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
          <Clock className="w-4 h-4 text-[#ff4d00]" /> Upcoming
        </h3>

        <AnimatePresence>
          {activeReminders.length > 0 ? (
            activeReminders.map((reminder, index) => {
              const TypeIcon = REMINDER_TYPE_CONFIG[reminder.type].icon;
              const isDue = new Date(reminder.remindAt) <= new Date();

              return (
                  <motion.div
                  key={reminder.id}
                  id={`reminder-item-${reminder.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className={`group p-4 bg-[#141414] border rounded-2xl flex items-center gap-4 transition-all ${
                    isDue
                      ? 'border-rose-500/30 bg-rose-500/[0.03]'
                      : 'border-white/[0.08] hover:border-[#ff4d00]/30'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isDue
                      ? 'bg-rose-500/10 text-rose-400'
                      : 'bg-white/[0.04] text-[#fafaf9]/60'
                  }`}>
                    <TypeIcon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className={`text-sm font-semibold ${isDue ? 'text-rose-400' : 'text-[#fafaf9]'}`} style={{ fontFamily: 'var(--font-display)' }}>
                        {reminder.title}
                      </h4>
                      {reminder.recurrence !== 'none' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-[#fafaf9]/50 border border-white/[0.08]">
                          <Repeat className="w-2.5 h-2.5 inline mr-0.5" />
                          {RECURRENCE_OPTIONS.find((r) => r.value === reminder.recurrence)?.label}
                        </span>
                      )}
                    </div>

                    {reminder.message && (
                      <p className="text-xs text-[#fafaf9]/60 mt-1">{reminder.message}</p>
                    )}

                    {reminder.contactId && getContactName(reminder.contactId) && (
                      <div className="flex items-center gap-2 mt-1.5">
                        <User className="w-3 h-3 text-[#fafaf9]/30" />
                        <span className="text-xs text-[#fafaf9]/50">{getContactName(reminder.contactId)}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2.5 mt-1.5 text-[11px] text-[#fafaf9]/40">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-[#fafaf9]/20" />
                        {new Date(reminder.remindAt).toLocaleString()}
                      </span>
                      {reminder.snoozedUntil && (
                        <span className="flex items-center gap-1.5">
                          <PauseCircle className="w-3 h-3 text-[#8b5cf6]" />
                          Snoozed until {new Date(reminder.snoozedUntil).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      id={`edit-reminder-${reminder.id}`}
                      onClick={() => handleEdit(reminder)}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-xl text-[#fafaf9]/40 hover:text-[#fafaf9] hover:bg-white/[0.06] transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </motion.button>

                    <motion.button
                      id={`snooze-reminder-${reminder.id}`}
                      onClick={() => handleSnooze(reminder, 60)}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-xl text-[#fafaf9]/40 hover:text-[#8b5cf6] hover:bg-[#8b5cf6]/10 transition-colors"
                      title="Snooze 1 hour"
                    >
                      <PauseCircle className="w-3.5 h-3.5" />
                    </motion.button>

                    <motion.button
                      id={`complete-reminder-${reminder.id}`}
                      onClick={() => handleComplete(reminder)}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-xl text-[#fafaf9]/40 hover:text-[#10b981] hover:bg-[#10b981]/10 transition-colors"
                      title="Mark complete"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                    </motion.button>

                    <motion.button
                      id={`delete-reminder-${reminder.id}`}
                      onClick={() => handleDelete(reminder)}
                      whileTap={{ scale: 0.9 }}
                      className="p-2 rounded-xl text-[#fafaf9]/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 bg-[#141414] border border-white/[0.08] rounded-3xl"
            >
              <Bell className="w-12 h-12 text-[#fafaf9]/10 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)' }}>
                All caught up!
              </h3>
              <p className="text-sm text-[#fafaf9]/50 mt-2">No active reminders scheduled.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Actions for Contacts */}
      {contacts.length > 0 && (
        <div className="pt-4 border-t border-white/[0.08]">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#fafaf9]/40 mb-3">
            Quick Follow-up
          </h3>
          <div className="flex flex-wrap gap-2">
            {contacts.filter((c) => c.lastContactedAt).slice(0, 5).map((contact) => (
              <motion.button
                key={contact.id}
                onClick={() => quickAddFollowup(contact)}
                whileTap={{ scale: 0.97 }}
                className="px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-xs text-[#fafaf9] transition-all flex items-center gap-1.5"
              >
                <span className="w-4 h-4 rounded-full bg-[#ff4d00]/20 flex items-center justify-center text-[#ff4d00] text-[8px] font-bold">
                  {contact.firstName.charAt(0)}
                </span>
                <span>Follow up {contact.firstName}</span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Reminder Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            id="reminder-form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              id="reminder-form-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#141414] border border-white/[0.08] rounded-[2rem] shadow-2xl p-6 sm:p-8 text-[#fafaf9]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {editingReminder ? 'Edit Reminder' : 'New Reminder'}
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
                    Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(REMINDER_TYPE_CONFIG).map(([typeKey, config]) => {
                      const Icon = config.icon;
                      return (
                        <motion.button
                          key={typeKey}
                          type="button"
                          onClick={() => setType(typeKey as ReminderType)}
                          whileTap={{ scale: 0.97 }}
                          className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                            type === typeKey
                              ? 'bg-[#ff4d00]/15 border-[#ff4d00]/30 text-[#ff4d00]'
                              : 'bg-[#0a0a0a] border-white/[0.08] text-[#fafaf9]/60 hover:text-[#fafaf9]'
                          }`}
                        >
                          <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                          {config.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">
                    Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="reminder-title-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Call with Sarah about Q4"
                    className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-[#ff4d00]" /> When
                  </label>
                  <input
                    id="reminder-datetime-input"
                    type="datetime-local"
                    value={remindAt}
                    onChange={(e) => setRemindAt(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-[#3b82f6]" /> Contact
                    </label>
                    <select
                      id="reminder-contact-select"
                      value={contactId}
                      onChange={(e) => setContactId(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                    >
                      <option value="">None</option>
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider flex items-center gap-2">
                      <Repeat className="w-3.5 h-3.5 text-[#8b5cf6]" /> Recurrence
                    </label>
                    <select
                      id="reminder-recurrence-select"
                      value={recurrence}
                      onChange={(e) => setRecurrence(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                    >
                      {RECURRENCE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">Message</label>
                  <textarea
                    id="reminder-message-input"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Additional context or action items..."
                    rows={2}
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
                  id="save-reminder-btn"
                  type="submit"
                  form="reminder-form-overlay"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  className="px-6 py-2.5 bg-[#ff4d00] hover:bg-[#ff6a2f] text-white font-bold rounded-2xl shadow-lg shadow-[#ff4d00]/20 text-sm transition-all"
                >
                  {editingReminder ? 'Save Changes' : 'Create Reminder'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
