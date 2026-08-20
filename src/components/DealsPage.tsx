import React, { useState } from 'react';
import {
  Plus,
  BarChart3,
  DollarSign,
  User,
  Calendar,
  GripVertical,
  Trash2,
  Edit3,
  X,
  AlertCircle
} from 'lucide-react';
import { Deal, DealStage, Contact } from '../types';
import { useCrm } from '../contexts/CrmContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface DealsPageProps {
  contacts: Contact[];
}

const DEAL_STAGES: { id: DealStage; label: string; color: string }[] = [
  { id: 'lead', label: 'Lead', color: 'bg-[#8b5cf6]/10 text-[#8b5cf6] border-[#8b5cf6]/20' },
  { id: 'qualified', label: 'Qualified', color: 'bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20' },
  { id: 'proposal', label: 'Proposal', color: 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-[#ff9500]/10 text-[#ff9500] border-[#ff9500]/20' },
  { id: 'won', label: 'Won', color: 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/20' },
  { id: 'lost', label: 'Lost', color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
];

export const DealsPage: React.FC<DealsPageProps> = ({ contacts }) => {
  const { deals, addDeal, updateDeal, deleteDeal, leadScores } = useCrm();
  const { isAuthenticated } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [stage, setStage] = useState<DealStage>('lead');
  const [probability, setProbability] = useState(50);
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [contactId, setContactId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const getContactName = (id?: string) => {
    if (!id) return null;
    const c = contacts.find((c) => c.id === id);
    return c ? `${c.firstName} ${c.lastName}` : null;
  };

  const getDealScore = (contactId?: string) => {
    if (!contactId) return null;
    return leadScores.find((s) => s.contactId === contactId);
  };

  const dealsByStage = (stageId: DealStage) =>
    deals.filter((d) => d.stage === stageId).sort((a, b) => {
      const va = a.value || 0;
      const vb = b.value || 0;
      return vb - va;
    });

  const totalPipelineValue = deals
    .filter((d) => d.stage !== 'won' && d.stage !== 'lost')
    .reduce((sum, d) => sum + (d.value || 0), 0);

  const wonValue = deals.filter((d) => d.stage === 'won').reduce((sum, d) => sum + (d.value || 0), 0);

  const handleOpenAdd = () => {
    setEditingDeal(null);
    setTitle('');
    setValue('');
    setStage('lead');
    setProbability(50);
    setExpectedCloseDate('');
    setNotes('');
    setContactId('');
    setError(null);
    setShowForm(true);
  };

  const handleEdit = (deal: Deal) => {
    setEditingDeal(deal);
    setTitle(deal.title);
    setValue(String(deal.value || ''));
    setStage(deal.stage);
    setProbability(deal.probability || 50);
    setExpectedCloseDate(deal.expectedCloseDate || '');
    setNotes(deal.notes || '');
    setContactId(deal.contactId || '');
    setError(null);
    setShowForm(true);
  };

  const handleDrop = (dealId: string, newStage: DealStage) => {
    updateDeal(dealId, { stage: newStage });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Deal title is required.');
      return;
    }
    if (isNaN(Number(value)) || Number(value) < 0) {
      setError('Please enter a valid deal value.');
      return;
    }
    setError(null);

    const dealData: any = {
      title: title.trim(),
      value: Number(value),
      stage,
      probability,
      expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate).toISOString().slice(0, 10) : undefined,
      notes: notes.trim() || undefined,
      contactId: contactId || undefined,
    };

    if (editingDeal) {
      await updateDeal(editingDeal.id, dealData);
    } else {
      await addDeal(dealData);
    }
    setShowForm(false);
  };

  const handleDelete = async (deal: Deal) => {
    if (window.confirm(`Delete deal "${deal.title}"?`)) {
      await deleteDeal(deal.id);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (!isAuthenticated) {
    return (
      <div className="p-8 bg-[#141414] border border-white/[0.08] rounded-3xl text-center space-y-4">
        <BarChart3 className="w-8 h-8 text-[#ff4d00] mx-auto" />
        <h3 className="text-lg font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)' }}>
          Sign in to manage deals
        </h3>
        <p className="text-sm text-[#fafaf9]/50">Track your sales pipeline with deal management.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)' }}>
            Deals
          </h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] text-[#fafaf9]/60 font-mono border border-white/[0.08]">
            {deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost').length} active
          </span>
        </div>

        <motion.button
          id="add-deal-btn"
          onClick={handleOpenAdd}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-4 py-2.5 bg-[#ff4d00] hover:bg-[#ff6a2f] text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-[#ff4d00]/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Deal</span>
        </motion.button>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-[#141414] border border-white/[0.08] rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#fafaf9]/50">
            <DollarSign className="w-3.5 h-3.5 text-[#ff4d00]" />
            <span>Pipeline Value</span>
          </div>
          <p className="text-xl font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)' }}>
            {formatCurrency(totalPipelineValue)}
          </p>
        </div>
        <div className="p-4 bg-[#141414] border border-white/[0.08] rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#fafaf9]/50">
            <BarChart3 className="w-3.5 h-3.5 text-[#10b981]" />
            <span>Won Value</span>
          </div>
          <p className="text-xl font-bold text-[#10b981]" style={{ fontFamily: 'var(--font-display)' }}>
            {formatCurrency(wonValue)}
          </p>
        </div>
        <div className="p-4 bg-[#141414] border border-white/[0.08] rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#fafaf9]/50">
            <User className="w-3.5 h-3.5 text-[#3b82f6]" />
            <span>Total Deals</span>
          </div>
          <p className="text-xl font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)' }}>
            {deals.length}
          </p>
        </div>
        <div className="p-4 bg-[#141414] border border-white/[0.08] rounded-2xl space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-[#fafaf9]/50">
            <Calendar className="w-3.5 h-3.5 text-[#8b5cf6]" />
            <span>Closing This Month</span>
          </div>
          <p className="text-xl font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)' }}>
            {deals.filter((d) => {
              if (!d.expectedCloseDate) return false;
              const d2 = new Date(d.expectedCloseDate);
              const now = new Date();
              return d2.getMonth() === now.getMonth() && d2.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
      </div>

      {/* Kanban Board */}
      <div id="deals-kanban" className="overflow-x-auto">
        <div className="flex gap-4 pb-4 min-w-min">
          {DEAL_STAGES.filter((s) => s.id !== 'won' && s.id !== 'lost').map((stageCol) => {
            const stageDeals = dealsByStage(stageCol.id);
            return (
              <div
                key={stageCol.id}
                id={`deal-stage-${stageCol.id}`}
                className="flex-1 min-w-[200px] space-y-3"
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'move';
                }}
                onDrop={(e) => {
                  const dealId = e.dataTransfer.getData('text/plain');
                  if (dealId) handleDrop(dealId, stageCol.id);
                }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#fafaf9]/50">
                    {stageCol.label}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${
                      stageCol.id === 'lead'
                        ? 'bg-[#8b5cf6]/10 text-[#8b5cf6]'
                        : stageCol.id === 'qualified'
                          ? 'bg-[#3b82f6]/10 text-[#3b82f6]'
                          : stageCol.id === 'proposal'
                            ? 'bg-[#10b981]/10 text-[#10b981]'
                            : 'bg-[#ff9500]/10 text-[#ff9500]'
                    }`}
                  >
                    {stageDeals.length}
                  </span>
                </div>

                <div className="space-y-3">
                  <AnimatePresence>
                    {stageDeals.map((deal) => (
                      <motion.div
                        key={deal.id}
                        id={`deal-card-${deal.id}`}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.2 }}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', deal.id);
                        }}
                        className="group p-4 bg-[#141414] border border-white/[0.08] hover:border-[#ff4d00]/30 rounded-2xl cursor-grab transition-all"
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <GripVertical className="w-4 h-4 text-[#fafaf9]/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-[#fafaf9] group-hover:text-[#ff4d00] transition-colors" style={{ fontFamily: 'var(--font-display)' }}>
                              {deal.title}
                            </h4>
                            <p className="text-xs text-[#fafaf9]/50 mt-1">{formatCurrency(deal.value || 0)}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <motion.button
                              id={`edit-deal-${deal.id}`}
                              onClick={() => handleEdit(deal)}
                              whileTap={{ scale: 0.9 }}
                              className="p-1 rounded-lg text-[#fafaf9]/40 hover:text-[#fafaf9] hover:bg-white/[0.06] transition-colors opacity-0 group-hover:opacity-100"
                              title="Edit deal"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </motion.button>
                            <motion.button
                              id={`delete-deal-${deal.id}`}
                              onClick={() => handleDelete(deal)}
                              whileTap={{ scale: 0.9 }}
                              className="p-1 rounded-lg text-[#fafaf9]/30 hover:text-rose-400 hover:bg-rose-500/10 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete deal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </motion.button>
                          </div>
                        </div>

                        {deal.contactId && getContactName(deal.contactId) && (
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-5 h-5 rounded-full bg-[#ff4d00]/20 flex items-center justify-center text-[#ff4d00] text-[8px] font-bold">
                              {getContactName(deal.contactId)!.split(' ').map(n => n[0]).join('')}
                            </div>
                            <span className="text-xs text-[#fafaf9]/60 truncate">
                              {getContactName(deal.contactId)}
                            </span>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-[#fafaf9]/40">
                          <span>{deal.probability}% probability</span>
                          {deal.expectedCloseDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#fafaf9]/20" />
                              {new Date(deal.expectedCloseDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {stageDeals.length === 0 && (
                    <div className="text-center py-8 text-[#fafaf9]/20 text-xs">
                      No deals in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Won / Lost columns */}
          {['won', 'lost'].map((status) => {
            const stageDeals = dealsByStage(status as DealStage);
            const config = DEAL_STAGES.find((s) => s.id === status)!;
            return (
              <div key={status} className="flex-1 min-w-[180px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#fafaf9]/50">
                    {status === 'won' ? config.label : config.label}
                  </h3>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono ${config.color}`}
                  >
                    {stageDeals.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {stageDeals.map((deal) => (
                    <motion.div
                      key={deal.id}
                      className="p-3 bg-[#141414] border border-white/[0.08] rounded-xl text-xs"
                    >
                      <p className="font-semibold text-[#fafaf9] truncate" style={{ fontFamily: 'var(--font-display)' }}>
                        {deal.title}
                      </p>
                      <p className="text-[#fafaf9]/50 mt-1">{formatCurrency(deal.value || 0)}</p>
                    </motion.div>
                  ))}
                  {status === 'lost' && stageDeals.length === 0 && (
                    <div className="text-center py-6 text-[#fafaf9]/20 text-xs">
                      No lost deals
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add/Edit Deal Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            id="deal-form-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowForm(false)}
          >
            <motion.div
              id="deal-form-card"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-[#141414] border border-white/[0.08] rounded-[2rem] shadow-2xl p-6 sm:p-8 text-[#fafaf9]"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <h3 className="text-lg font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
                  {editingDeal ? 'Edit Deal' : 'New Deal'}
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
                    Deal Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="deal-title-input"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Q4 Enterprise Contract"
                    className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider flex items-center gap-2">
                      <DollarSign className="w-3.5 h-3.5 text-[#ff4d00]" /> Value
                    </label>
                    <input
                      id="deal-value-input"
                      type="number"
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">
                      Stage
                    </label>
                    <select
                      id="deal-stage-select"
                      value={stage}
                      onChange={(e) => setStage(e.target.value as DealStage)}
                      className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                    >
                      {DEAL_STAGES.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">
                      Probability: {probability}%
                    </label>
                    <input
                      id="deal-probability-input"
                      type="range"
                      min="0"
                      max="100"
                      value={probability}
                      onChange={(e) => setProbability(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-[#ff4d00]" /> Expected Close
                    </label>
                    <input
                      id="deal-close-date-input"
                      type="date"
                      value={expectedCloseDate}
                      onChange={(e) => setExpectedCloseDate(e.target.value)}
                      className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">
                    Link to Contact
                  </label>
                  <select
                    id="deal-contact-select"
                    value={contactId}
                    onChange={(e) => setContactId(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-2xl px-4 py-3 text-sm text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 transition-all"
                  >
                    <option value="">None</option>
                    {contacts.map((c) => {
                      const score = getDealScore(c.id);
                      return (
                        <option key={c.id} value={c.id}>
                          {c.firstName} {c.lastName} {score ? `(${score.score})` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">Notes</label>
                  <textarea
                    id="deal-notes-input"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Deal notes, objections, key details..."
                    rows={3}
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
                  id="save-deal-btn"
                  type="submit"
                  onClick={handleSubmit}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-2.5 bg-[#ff4d00] hover:bg-[#ff6a2f] text-white font-bold rounded-2xl shadow-lg shadow-[#ff4d00]/20 text-sm transition-all"
                >
                  {editingDeal ? 'Save Changes' : 'Create Deal'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
