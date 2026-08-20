import React, { useMemo } from 'react';
import {
  BarChart3,
  Users,
  TrendingUp,
  DollarSign,
  CheckSquare,
  Bell,
  PieChart,
  Activity
} from 'lucide-react';
import { Contact, Deal, Task, Company, Reminder, LeadScore, DealStage } from '../types';
import { useCrm } from '../contexts/CrmContext';
import { useAuth } from '../contexts/AuthContext';
import { getLeadScoreTierColor, getScoreBadgeColor } from '../utils/leadScoring';
import { motion } from 'motion/react';

interface ReportsPageProps {
  contacts: Contact[];
}

interface ReportStats {
  totalContacts: number;
  favoriteCount: number;
  vipCount: number;
  totalInteractions: number;
  recentlyActive: number;
  totalDealValue: number;
  wonValue: number;
  winRate: number;
  activeDealCount: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  hotLeads: number;
  vipLeads: number;
  highPriorityTasks: number;
  categoryCounts: Record<string, number>;
  stageCounts: Record<string, number>;
  tierCounts: Record<string, number>;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ contacts }) => {
  const { deals, tasks, companies, leadScores, dueReminders } = useCrm();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="p-8 bg-[#141414] border border-white/[0.08] rounded-3xl text-center space-y-4">
        <PieChart className="w-8 h-8 text-[#ff4d00] mx-auto" />
        <h3 className="text-lg font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)' }}>
          Sign in for analytics
        </h3>
        <p className="text-sm text-[#fafaf9]/50">View reports on your contacts, deals, and performance.</p>
      </div>
    );
  }

  const stats = useMemo<ReportStats>(() => {
    const totalContacts = contacts.length;
    const favoriteCount = contacts.filter((c) => c.isFavorite).length;
    const vipCount = contacts.filter((c) => c.category === 'VIP').length;
    const totalInteractions = contacts.reduce((sum, c) => sum + (c.interactions?.length || 0), 0);
    const recentlyActive = contacts.filter(
      (c) => c.lastContactedAt && new Date(Date.now() - 30 * 24 * 3600000) > new Date(c.lastContactedAt)
    ).length;

    const totalDealValue = deals.reduce((sum, d) => sum + (d.value || 0), 0);
    const wonDeals = deals.filter((d) => d.stage === 'won');
    const lostDeals = deals.filter((d) => d.stage === 'lost');
    const activeDeals = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
    const wonValue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const winRate = deals.length > 0 ? (wonDeals.length / deals.length) * 100 : 0;

    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    const pendingTasks = tasks.filter((t) => t.status !== 'completed').length;
    const overdueTasks = tasks.filter(
      (t) => t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date()
    ).length;

    const hotLeads = leadScores.filter((s) => s.tier === 'hot' || s.tier === 'vip').length;
    const vipLeads = leadScores.filter((s) => s.tier === 'vip').length;
    const highPriorityTasks = tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length;

    // Category distribution
    const categoryCounts = contacts.reduce((acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Deal stage distribution
    const stageCounts = deals.reduce((acc, d) => {
      acc[d.stage] = (acc[d.stage] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Lead score tiers
    const tierCounts = leadScores.reduce((acc, s) => {
      acc[s.tier] = (acc[s.tier] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalContacts,
      favoriteCount,
      vipCount,
      totalInteractions,
      recentlyActive,
      totalDealValue,
      wonValue,
      winRate,
      activeDealCount: activeDeals.length,
      completedTasks,
      pendingTasks,
      overdueTasks,
      hotLeads,
      vipLeads,
      highPriorityTasks,
      categoryCounts,
      stageCounts,
      tierCounts,
    };
  }, [contacts, deals, tasks, leadScores]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const maxStageCount = Math.max(...(Object.values(stats.stageCounts) as number[]).filter(v => v > 0), 1);

  const DEAL_STAGE_COLORS: Record<DealStage, string> = {
    lead: 'bg-[#8b5cf6]',
    qualified: 'bg-[#3b82f6]',
    proposal: 'bg-[#10b981]',
    negotiation: 'bg-[#ff9500]',
    won: 'bg-[#10b981]',
    lost: 'bg-rose-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)' }}>
            Reports & Analytics
          </h2>
          <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] text-[#fafaf9]/60 font-mono border border-white/[0.08]">
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          className="p-5 bg-[#141414] border border-white/[0.08] rounded-2xl space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 text-xs text-[#fafaf9]/50">
            <Users className="w-4 h-4 text-[#3b82f6]" />
            <span>Total Contacts</span>
          </div>
          <p className="text-2xl font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)' }}>
            {stats.totalContacts}
          </p>
          <p className="text-[11px] text-[#fafaf9]/40">{stats.favoriteCount} starred, {stats.vipCount} VIP</p>
        </motion.div>

        <motion.div
          className="p-5 bg-[#141414] border border-white/[0.08] rounded-2xl space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="flex items-center gap-2 text-xs text-[#fafaf9]/50">
            <DollarSign className="w-4 h-4 text-[#10b981]" />
            <span>Total Deal Value</span>
          </div>
          <p className="text-2xl font-bold text-[#10b981]" style={{ fontFamily: 'var(--font-display)' }}>
            {formatCurrency(stats.totalDealValue)}
          </p>
          <p className="text-[11px] text-[#fafaf9]/40">{stats.activeDealCount} active, {stats.winRate.toFixed(0)}% win rate</p>
        </motion.div>

        <motion.div
          className="p-5 bg-[#141414] border border-white/[0.08] rounded-2xl space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 text-xs text-[#fafaf9]/50">
            <CheckSquare className="w-4 h-4 text-[#ff4d00]" />
            <span>Tasks</span>
          </div>
          <p className="text-2xl font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)' }}>
            {stats.pendingTasks}
          </p>
          <p className="text-[11px] text-[#fafaf9]/40">{stats.completedTasks} completed, {stats.overdueTasks} overdue</p>
        </motion.div>

        <motion.div
          className="p-5 bg-[#141414] border border-white/[0.08] rounded-2xl space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="flex items-center gap-2 text-xs text-[#fafaf9]/50">
            <Bell className="w-4 h-4 text-[#8b5cf6]" />
            <span>Reminders</span>
          </div>
          <p className="text-2xl font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)' }}>
            {dueReminders.length}
          </p>
          <p className="text-[11px] text-[#fafaf9]/40">due now</p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Lead Score Distribution */}
        <motion.div
          className="p-6 bg-[#141414] border border-white/[0.08] rounded-3xl space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-sm font-bold text-[#fafaf9] flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <BarChart3 className="w-4 h-4 text-[#ff4d00]" /> Lead Score Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries({ vip: 0, hot: 0, warm: 0, cold: 0 }).map(([tier, _]) => {
              const count = stats.tierCounts[tier] || 0;
              const percentage = leadScores.length > 0 ? (count / leadScores.length) * 100 : 0;
              const tierColor = tier === 'vip'
                ? 'bg-[#ff4d00]'
                : tier === 'hot'
                  ? 'bg-rose-400'
                  : tier === 'warm'
                    ? 'bg-amber-400'
                    : 'bg-[#fafaf9]/30';
              return (
                <div key={tier} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#fafaf9]/70 capitalize">{tier}</span>
                    <span className="text-[#fafaf9] font-mono">{count} ({percentage.toFixed(0)}%)</span>
                  </div>
                  <div className="w-full bg-[#0a0a0a] rounded-full h-2 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${tierColor}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.6, delay: 0.3 + (['vip', 'hot', 'warm', 'cold'].indexOf(tier) * 0.1) }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Deal Pipeline */}
        <motion.div
          className="p-6 bg-[#141414] border border-white/[0.08] rounded-3xl space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <h3 className="text-sm font-bold text-[#fafaf9] flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <TrendingUp className="w-4 h-4 text-[#10b981]" /> Deal Pipeline by Stage
          </h3>
          <div className="space-y-3">
            {(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'] as const).map((stage) => {
              const count = stats.stageCounts[stage] || 0;
              const percentage = active_deal_total(stats.stageCounts) > 0
                ? (count / active_deal_total(stats.stageCounts)) * 100
                : 0;
              return (
                <div key={stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#fafaf9]/70 capitalize">{stage}</span>
                    <span className="text-[#fafaf9] font-mono">{count} deals</span>
                  </div>
                  <div className="w-full bg-[#0a0a0a] rounded-full h-2 overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${DEAL_STAGE_COLORS[stage]}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.6, delay: 0.35 + (['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'].indexOf(stage) * 0.08) }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-4 border-t border-white/[0.08]">
            <div className="flex items-center justify-between text-xs text-[#fafaf9]/60">
              <span>Total deal value</span>
              <span className="font-semibold text-[#fafaf9]">{formatCurrency(stats.totalDealValue)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#fafaf9]/60 mt-1">
              <span>Won value</span>
              <span className="font-semibold text-[#10b981]">{formatCurrency(stats.wonValue)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-[#fafaf9]/60 mt-1">
              <span>Win rate</span>
              <span className="font-semibold text-[#fafaf9]">{stats.winRate.toFixed(0)}%</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Contact Activity & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Category Breakdown */}
        <motion.div
          className="p-6 bg-[#141414] border border-white/[0.08] rounded-3xl space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-sm font-bold text-[#fafaf9] flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <Activity className="w-4 h-4 text-[#ff4d00]" /> Contact Categories
          </h3>
          <div className="space-y-2.5">
            {(Object.entries(stats.categoryCounts) as [string, number][]).map(([category, count]) => {
              const pct = total_contacts(stats.categoryCounts) > 0 ? (count / total_contacts(stats.categoryCounts)) * 100 : 0;
              const colors: Record<string, string> = {
                Work: 'bg-[#3b82f6]',
                Client: 'bg-[#10b981]',
                VIP: 'bg-[#ff4d00]',
                Family: 'bg-[#f43f5e]',
                Personal: 'bg-[#8b5cf6]',
                Other: 'bg-[#fafaf9]/40',
              };
              const color = colors[category] || 'bg-[#fafaf9]/30';
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${color}`} />
                    <span className="text-sm text-[#fafaf9]">{category}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-[#fafaf9]/60">{count}</span>
                    <div className="w-24 h-2 bg-[#0a0a0a] rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-[#ff4d00] rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.6, delay: 0.4 + (Object.keys(stats.categoryCounts).indexOf(category) * 0.08) }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          className="p-6 bg-[#141414] border border-white/[0.08] rounded-3xl space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <h3 className="text-sm font-bold text-[#fafaf9] flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <PieChart className="w-4 h-4 text-[#8b5cf6]" /> Engagement Overview
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#0a0a0a]/50 rounded-xl">
              <span className="text-xs text-[#fafaf9]/60">Total Interactions</span>
              <span className="text-sm font-bold text-[#fafaf9]">{stats.totalInteractions}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-[#0a0a0a]/50 rounded-xl text-center">
                <p className="text-xl font-bold text-[#ff4d00]" style={{ fontFamily: 'var(--font-display)' }}>{stats.hotLeads}</p>
                <p className="text-[10px] text-[#fafaf9]/50">Hot + VIP Leads</p>
              </div>
              <div className="p-3 bg-[#0a0a0a]/50 rounded-xl text-center">
                <p className="text-xl font-bold text-[#3b82f6]" style={{ fontFamily: 'var(--font-display)' }}>{stats.highPriorityTasks}</p>
                <p className="text-[10px] text-[#fafaf9]/50">High Priority Tasks</p>
              </div>
            </div>
            <div className="p-3 bg-[#0a0a0a]/50 rounded-xl">
              <p className="text-xs text-[#fafaf9]/50 mb-2">Recent Activity (30 days)</p>
              <p className="text-sm font-bold text-[#fafaf9]">{stats.recentlyActive} of {stats.totalContacts} contacts</p>
              <div className="w-full bg-[#141414] rounded-full h-1.5 mt-2 overflow-hidden">
                <motion.div
                  className="h-full bg-[#10b981] rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(stats.recentlyActive / Math.max(stats.totalContacts, 1)) * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

function active_deal_total(stageCounts: Record<string, number>): number {
  return (stageCounts['lead'] || 0) + (stageCounts['qualified'] || 0) + (stageCounts['proposal'] || 0) + (stageCounts['negotiation'] || 0);
}

function total_contacts(categoryCounts: Record<string, number>): number {
  return Object.values(categoryCounts).reduce((a, b) => a + b, 0);
}
