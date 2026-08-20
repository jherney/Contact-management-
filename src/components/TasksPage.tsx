import React, { useState } from 'react';
import {
  Plus,
  CheckCircle,
  Circle,
  Clock,
  AlertCircle,
  X,
  Calendar,
  Filter,
  Trash2,
  Edit3
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, Contact } from '../types';
import { useCrm } from '../contexts/CrmContext';
import { useAuth } from '../contexts/AuthContext';
import { formatRelativeTime } from '../utils/contactUtils';
import { motion, AnimatePresence } from 'motion/react';

interface TasksPageProps {
  contacts: Contact[];
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; icon: string }> = {
  low: { label: 'Low', color: 'text-[#8b5cf6]', icon: '🟢' },
  medium: { label: 'Medium', color: 'text-[#3b82f6]', icon: '🟡' },
  high: { label: 'High', color: 'text-rose-400', icon: '🔴' },
};

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'text-[#fafaf9]/50' },
  in_progress: { label: 'In Progress', color: 'text-[#ff4d00]' },
  completed: { label: 'Completed', color: 'text-[#10b981]' },
};

export const TasksPage: React.FC<TasksPageProps> = ({ contacts }) => {
  const { tasks, addTask, updateTask, deleteTask, completeTask } = useCrm();
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | 'all'>('all');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [contactId, setContactId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const visibleTasks = tasks.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    return true;
  }).sort((a, b) => {
    const aTime = new Date(a.dueDate || a.createdAt).getTime();
    const bTime = new Date(b.dueDate || b.createdAt).getTime();
    return aTime - bTime;
  });

  const pendingCount = tasks.filter((t) => t.status !== 'completed').length;
  const overdueCount = tasks.filter(
    (t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date()
  ).length;

  const handleOpenAdd = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setDueDate('');
    setPriority('medium');
    setContactId('');
    setError(null);
    setShowForm(true);
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : '');
    setPriority(task.priority);
    setContactId(task.contactId || '');
    setError(null);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }
    setError(null);

    const taskData = {
      title: title.trim(),
      description: description.trim() || undefined,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      priority,
      contactId: contactId || undefined,
    };

    if (editingTask) {
      await updateTask(editingTask.id, taskData);
    } else {
      await addTask(taskData);
    }
    setShowForm(false);
  };

  const handleCompleteToggle = async (task: Task) => {
    if (task.status === 'completed') {
      await updateTask(task.id, { status: 'pending', completedAt: undefined });
    } else {
      await completeTask(task.id);
    }
  };

  const getContactName = (id?: string) => {
    if (!id) return null;
    const c = contacts.find((c) => c.id === id);
    return c ? `${c.firstName} ${c.lastName}` : null;
  };

  const isOverdue = (task: Task) => {
    return task.status !== 'completed' && task.dueDate && new Date(task.dueDate) < new Date();
  };

  if (!isAuthenticated) {
    return (
      <div className="p-8 bg-[#141414] border border-white/[0.08] rounded-3xl text-center space-y-4">
        <AlertCircle className="w-8 h-8 text-[#ff4d00] mx-auto" />
        <h3 className="text-lg font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)' }}>
          Sign in to manage tasks
        </h3>
        <p className="text-sm text-[#fafaf9]/50">Create an account to track to-dos and follow-ups.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)' }}>
            Tasks
          </h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] text-[#fafaf9]/60 font-mono border border-white/[0.08]">
            {pendingCount} pending
          </span>
          {overdueCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 font-mono border border-rose-500/20">
              {overdueCount} overdue
            </span>
          )}
        </div>

        <motion.button
          id="add-task-btn"
          onClick={handleOpenAdd}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2.5 bg-[#ff4d00] hover:bg-[#ff6a2f] text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-[#ff4d00]/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </motion.button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-[#fafaf9]/40" />
          <span className="text-[#fafaf9]/50">Status:</span>
          {(['all', 'pending', 'in_progress', 'completed'] as const).map((s) => (
            <motion.button
              key={s}
              onClick={() => setFilterStatus(s)}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filterStatus === s
                  ? 'bg-[#ff4d00] text-white border-[#ff4d00]'
                  : 'bg-[#0a0a0a] text-[#fafaf9]/60 border-white/[0.08] hover:border-white/[0.15]'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#fafaf9]/50">Priority:</span>
          {(['all', 'low', 'medium', 'high'] as const).map((p) => (
            <motion.button
              key={p}
              onClick={() => setFilterPriority(p)}
              whileTap={{ scale: 0.95 }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                filterPriority === p
                  ? 'bg-[#ff4d00] text-white border-[#ff4d00]'
                  : 'bg-[#0a0a0a] text-[#fafaf9]/60 border-white/[0.08] hover:border-white/[0.15]'
              }`}
            >
              {p === 'all' ? 'All' : PRIORITY_CONFIG[p].label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <AnimatePresence>
        {visibleTasks.length > 0 ? (
          <motion.div
            id="tasks-list"
            className="space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {visibleTasks.map((task) => (
              <motion.div
                key={task.id}
                id={`task-item-${task.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className={`p-4 bg-[#141414] border rounded-2xl flex items-start gap-3 transition-all ${
                  task.status === 'completed'
                    ? 'border-white/[0.04] opacity-70'
                    : isOverdue(task)
                      ? 'border-rose-500/30 bg-rose-500/[0.03]'
                      : 'border-white/[0.08] hover:border-[#ff4d00]/30'
                }`}
              >
                <motion.button
                  id={`task-complete-${task.id}`}
                  onClick={() => handleCompleteToggle(task)}
                  whileTap={{ scale: 0.9 }}
                  className="mt-0.5 p-1 rounded-lg hover:bg-white/[0.06] transition-colors"
                >
                  {task.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-[#10b981]" />
                  ) : (
                    <Circle className={`w-5 h-5 ${isOverdue(task) ? 'text-rose-400' : 'text-[#fafaf9]/30'}`} />
                  )}
                </motion.button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3
                          className={`text-sm font-semibold ${
                            task.status === 'completed'
                              ? 'text-[#fafaf9]/50 line-through decoration-2'
                              : 'text-[#fafaf9]'
                          }`}
                          style={{ fontFamily: 'var(--font-display)' }}
                        >
                          {task.title}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            task.priority === 'high'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : task.priority === 'medium'
                                ? 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20'
                                : 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20'
                          }`}
                        >
                          {PRIORITY_CONFIG[task.priority].label}
                        </span>
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                            task.status === 'completed'
                              ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20'
                              : task.status === 'in_progress'
                                ? 'bg-[#ff4d00]/10 text-[#ff4d00] border-[#ff4d00]/20'
                                : 'bg-white/[0.06] text-[#fafaf9]/50 border-white/[0.08]'
                          }`}
                        >
                          {STATUS_CONFIG[task.status].label}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-[#fafaf9]/50 mt-1.5 leading-relaxed">{task.description}</p>
                      )}

                      <div className="flex items-center gap-4 mt-2 text-[11px] text-[#fafaf9]/40">
                        {task.dueDate && (
                          <span className="flex items-center gap-1.5">
                            <Clock className={`w-3 h-3 ${isOverdue(task) ? 'text-rose-400' : 'text-[#fafaf9]/20'}`} />
                            <span className={isOverdue(task) ? 'text-rose-400 font-medium' : ''}>
                              {isOverdue(task)
                                ? `Overdue (${new Date(task.dueDate).toLocaleDateString()})`
                                : `Due ${formatRelativeTime(task.dueDate)}`}
                            </span>
                          </span>
                        )}
                        {task.contactId && getContactName(task.contactId) && (
                          <span className="flex items-center gap-1.5">
                            <span className="w-4 h-4 rounded-full bg-[#ff4d00]/20 flex items-center justify-center text-[#ff4d00] text-[8px] font-bold">
                              {getContactName(task.contactId)!.split('').slice(0, 2).join('')}
                            </span>
                            <span>{getContactName(task.contactId)}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <motion.button
                        id={`edit-task-${task.id}`}
                        onClick={() => handleEdit(task)}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded-xl text-[#fafaf9]/40 hover:text-[#fafaf9] hover:bg-white/[0.06] transition-colors"
                        title="Edit task"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </motion.button>
                      <motion.button
                        id={`delete-task-${task.id}`}
                        onClick={() => deleteTask(task.id)}
                        whileTap={{ scale: 0.9 }}
                        className="p-1.5 rounded-xl text-[#fafaf9]/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="py-16 text-center bg-[#141414] border border-white/[0.08] rounded-3xl space-y-6"
          >
            <CheckCircle className="w-10 h-10 text-[#fafaf9]/10 mx-auto" />
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)' }}>
                {filterStatus === 'completed' || filterPriority !== 'all' || filterStatus !== 'all'
                  ? 'No tasks match your filters'
                  : 'No tasks yet'}
              </h3>
              <p className="text-sm text-[#fafaf9]/50 max-w-sm mx-auto">
                {filterStatus === 'completed'
                  ? 'You haven\'t completed any tasks yet.'
                  : 'Create your first task to start tracking follow-ups and action items.'}
              </p>
            </div>
            {(filterStatus !== 'all' || filterPriority !== 'all') ? null : (
              <motion.button
                id="empty-add-task-btn"
                onClick={handleOpenAdd}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 bg-[#ff4d00] hover:bg-[#ff6a2f] text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-[#ff4d00]/20 flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Task</span>
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add/Edit Task Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            id="task-form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              id="task-form-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#141414] border border-white/[0.08] rounded-[2rem] shadow-2xl p-6 sm:p-8 text-[#fafaf9]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {editingTask ? 'Edit Task' : 'New Task'}
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
                    Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="task-title-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    id="task-description-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add details or action items..."
                    rows={3}
                    className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 resize-none transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#ff4d00]" /> Due Date
                    </label>
                    <input
                      id="task-due-date-input"
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">
                      Priority
                    </label>
                    <select
                      id="task-priority-select"
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as TaskPriority)}
                      className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">
                    Link to Contact
                  </label>
                  <select
                    id="task-contact-select"
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
                  id="save-task-btn"
                  type="submit"
                  form="task-form-overlay"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  className="px-6 py-2.5 bg-[#ff4d00] hover:bg-[#ff6a2f] text-white font-bold rounded-2xl shadow-lg shadow-[#ff4d00]/20 text-sm transition-all"
                >
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
