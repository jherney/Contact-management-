import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Task,
  Deal,
  Company,
  Reminder,
  LeadScore,
  Contact
} from '../types';
import { tasksApi, dealsApi, companiesApi, remindersApi } from '../services/crmApi';
import { computeAllLeadScores } from '../utils/leadScoring';
import { useAuth } from './AuthContext';

interface CrmContextType {
  tasks: Task[];
  deals: Deal[];
  companies: Company[];
  reminders: Reminder[];
  leadScores: LeadScore[];
  dueReminders: Reminder[];
  isLoading: boolean;
  contactsForScoring: Contact[];
  setContactsForScoring: (contacts: Contact[]) => void;
  loadAll: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  addDeal: (deal: Omit<Deal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateDeal: (id: string, updates: Partial<Deal>) => Promise<void>;
  deleteDeal: (id: string) => Promise<void>;
  addCompany: (company: Omit<Company, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCompany: (id: string, updates: Partial<Company>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  addReminder: (reminder: Omit<Reminder, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>) => Promise<void>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  snoozeReminder: (id: string, until: string) => Promise<void>;
  completeReminder: (id: string) => Promise<void>;
  recomputeScores: () => void;
}

const CrmContext = createContext<CrmContextType | null>(null);

const STORAGE_KEY = 'contact_management_system_crm_v1';

function emptyEntity() {
  return { tasks: [], deals: [], companies: [], reminders: [] };
}

export function CrmProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [leadScores, setLeadScores] = useState<LeadScore[]>([]);
  const [contactsForScoring, setContactsForScoring] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const now = () => new Date().toISOString();

  useEffect(() => {
    setLeadScores(computeAllLeadScores(contactsForScoring, deals));
  }, [contactsForScoring, deals]);

  const loadAll = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const [tasksRes, dealsRes, companiesRes, remindersRes] = await Promise.allSettled([
        tasksApi.list(),
        dealsApi.list(),
        companiesApi.list(),
        remindersApi.list()
      ]);

      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value);
      if (dealsRes.status === 'fulfilled') setDeals(dealsRes.value);
      if (companiesRes.status === 'fulfilled') setCompanies(companiesRes.status === 'fulfilled' ? companiesRes.value : []);
      if (remindersRes.status === 'fulfilled') setReminders(remindersRes.value);

      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tasks: tasksRes.status === 'fulfilled' ? tasksRes.value : [],
        deals: dealsRes.status === 'fulfilled' ? dealsRes.value : [],
        companies: companiesRes.status === 'fulfilled' ? companiesRes.value : [],
        reminders: remindersRes.status === 'fulfilled' ? remindersRes.value : [],
      }));
    } catch (err) {
      console.error('[CRM] Failed to load entities:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadAll();
    } else {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setTasks(parsed.tasks || []);
          setDeals(parsed.deals || []);
          setCompanies(parsed.companies || []);
          setReminders(parsed.reminders || []);
        } catch {}
      }
    }
  }, [isAuthenticated, user, loadAll]);

  const dueReminders = reminders.filter(
    (r) =>
      r.status === 'active' &&
      new Date(r.remindAt) <= new Date() &&
      (!r.snoozedUntil || new Date(r.snoozedUntil) <= new Date())
  );

  const persist = useCallback((updater: (prev: any) => any) => {
    const stored = localStorage.getItem(STORAGE_KEY);
    let current = { tasks: [], deals: [], companies: [], reminders: [] };
    if (stored) {
      try { current = JSON.parse(stored); } catch {}
    }
    const next = updater(current);
    if (next !== current) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        tasks: next.tasks,
        deals: next.deals,
        companies: next.companies,
        reminders: next.reminders,
      }));
    }
  }, []);

  const addTask = useCallback(async (task: Omit<Task, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      userId: user?.id || 'local-user',
      createdAt: now(),
      updatedAt: now(),
      status: 'pending',
      priority: task.priority || 'medium',
    };
    setTasks(prev => [newTask, ...prev]);
    persist(prev => ({ ...prev, tasks: [newTask, ...prev.tasks] }));
    if (isAuthenticated) {
      try { await tasksApi.create(task); } catch (e) { console.warn('[CRM] task create failed:', e); }
    }
  }, [user, isAuthenticated, persist]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: now() } : t)
    );
    persist(prev => ({
      ...prev,
      tasks: prev.tasks.map((t: Task) => t.id === id ? { ...t, ...updates, updatedAt: now() } : t)
    }));
    if (isAuthenticated) {
      try { await tasksApi.update(id, updates); } catch (e) { console.warn('[CRM] task update failed:', e); }
    }
  }, [isAuthenticated, persist]);

  const deleteTask = useCallback(async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    persist(prev => ({ ...prev, tasks: prev.tasks.filter((t: Task) => t.id !== id) }));
    if (isAuthenticated) {
      try { await tasksApi.delete(id); } catch (e) { console.warn('[CRM] task delete failed:', e); }
    }
  }, [isAuthenticated, persist]);

  const completeTask = useCallback(async (id: string) => {
    const updated = { status: 'completed' as const, completedAt: now(), updatedAt: now() };
    setTasks(prev =>
      prev.map(t => t.id === id ? { ...t, ...updated } : t)
    );
    persist(prev => ({
      ...prev,
      tasks: prev.tasks.map((t: Task) => t.id === id ? { ...t, ...updated } : t)
    }));
    if (isAuthenticated) {
      try { await tasksApi.update(id, updated); } catch (e) { console.warn('[CRM] task complete failed:', e); }
    }
  }, [isAuthenticated, persist]);

  const addDeal = useCallback(async (deal: Omit<Deal, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const newDeal: Deal = {
      ...deal,
      id: `deal-${Date.now()}`,
      userId: user?.id || 'local-user',
      createdAt: now(),
      updatedAt: now(),
      stage: deal.stage || 'lead',
      probability: deal.probability || 50,
      value: deal.value || 0,
    };
    setDeals(prev => [newDeal, ...prev]);
    persist(prev => ({ ...prev, deals: [newDeal, ...prev.deals] }));
    if (isAuthenticated) {
      try { await dealsApi.create(deal); } catch (e) { console.warn('[CRM] deal create failed:', e); }
    }
  }, [user, isAuthenticated, persist]);

  const updateDeal = useCallback(async (id: string, updates: Partial<Deal>) => {
    setDeals(prev =>
      prev.map(d => d.id === id ? { ...d, ...updates, updatedAt: now() } : d)
    );
    persist(prev => ({
      ...prev,
      deals: prev.deals.map((d: Deal) => d.id === id ? { ...d, ...updates, updatedAt: now() } : d)
    }));
    if (isAuthenticated) {
      try { await dealsApi.update(id, updates); } catch (e) { console.warn('[CRM] deal update failed:', e); }
    }
  }, [isAuthenticated, persist]);

  const deleteDeal = useCallback(async (id: string) => {
    setDeals(prev => prev.filter(d => d.id !== id));
    persist(prev => ({ ...prev, deals: prev.deals.filter((d: Deal) => d.id !== id) }));
    if (isAuthenticated) {
      try { await dealsApi.delete(id); } catch (e) { console.warn('[CRM] deal delete failed:', e); }
    }
  }, [isAuthenticated, persist]);

  const addCompany = useCallback(async (company: Omit<Company, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    const newCompany: Company = {
      ...company,
      id: `company-${Date.now()}`,
      userId: user?.id || 'local-user',
      createdAt: now(),
      updatedAt: now(),
    };
    setCompanies(prev => {
      const updated = [...prev, newCompany].sort((a, b) => a.name.localeCompare(b.name));
      persist(p => ({ ...p, companies: updated }));
      return updated;
    });
    if (isAuthenticated) {
      try { await companiesApi.create(company); } catch (e) { console.warn('[CRM] company create failed:', e); }
    }
  }, [user, isAuthenticated, persist]);

  const updateCompany = useCallback(async (id: string, updates: Partial<Company>) => {
    setCompanies(prev =>
      prev.map(c => c.id === id ? { ...c, ...updates, updatedAt: now() } : c)
    );
    persist(prev => ({
      ...prev,
      companies: prev.companies.map((c: Company) => c.id === id ? { ...c, ...updates, updatedAt: now() } : c)
    }));
    if (isAuthenticated) {
      try { await companiesApi.update(id, updates); } catch (e) { console.warn('[CRM] company update failed:', e); }
    }
  }, [isAuthenticated, persist]);

  const deleteCompany = useCallback(async (id: string) => {
    setCompanies(prev => prev.filter(c => c.id !== id));
    persist(prev => ({ ...prev, companies: prev.companies.filter((c: Company) => c.id !== id) }));
    if (isAuthenticated) {
      try { await companiesApi.delete(id); } catch (e) { console.warn('[CRM] company delete failed:', e); }
    }
  }, [isAuthenticated, persist]);

  const addReminder = useCallback(async (reminder: Omit<Reminder, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'status'>) => {
    const newReminder: Reminder = {
      ...reminder,
      id: `reminder-${Date.now()}`,
      userId: user?.id || 'local-user',
      createdAt: now(),
      updatedAt: now(),
      status: 'active',
      recurrence: reminder.recurrence || 'none',
      type: reminder.type || 'custom',
    };
    setReminders(prev => [newReminder, ...prev].sort((a, b) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime()));
    persist(prev => ({
      ...prev,
      reminders: [newReminder, ...prev.reminders].sort((a: Reminder, b: Reminder) => new Date(a.remindAt).getTime() - new Date(b.remindAt).getTime())
    }));
    if (isAuthenticated) {
      try { await remindersApi.create(reminder); } catch (e) { console.warn('[CRM] reminder create failed:', e); }
    }
  }, [user, isAuthenticated, persist]);

  const updateReminder = useCallback(async (id: string, updates: Partial<Reminder>) => {
    setReminders(prev =>
      prev.map(r => r.id === id ? { ...r, ...updates, updatedAt: now() } : r)
    );
    persist(prev => ({
      ...prev,
      reminders: prev.reminders.map((r: Reminder) => r.id === id ? { ...r, ...updates, updatedAt: now() } : r)
    }));
    if (isAuthenticated) {
      try { await remindersApi.update(id, updates); } catch (e) { console.warn('[CRM] reminder update failed:', e); }
    }
  }, [isAuthenticated, persist]);

  const deleteReminder = useCallback(async (id: string) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    persist(prev => ({ ...prev, reminders: prev.reminders.filter((r: Reminder) => r.id !== id) }));
    if (isAuthenticated) {
      try { await remindersApi.delete(id); } catch (e) { console.warn('[CRM] reminder delete failed:', e); }
    }
  }, [isAuthenticated, persist]);

  const snoozeReminder = useCallback(async (id: string, until: string) => {
    await updateReminder(id, { status: 'snoozed', snoozedUntil: until });
  }, [updateReminder]);

  const completeReminder = useCallback(async (id: string) => {
    await updateReminder(id, { status: 'completed' });
  }, [updateReminder]);

  const recomputeScores = useCallback(() => {
    // This will be called with contacts from App context
  }, []);

  return (
    <CrmContext.Provider
      value={{
        tasks,
        deals,
        companies,
        reminders,
        leadScores,
        dueReminders,
        isLoading,
        contactsForScoring,
        setContactsForScoring,
        loadAll,
        addTask,
        updateTask,
        deleteTask,
        completeTask,
        addDeal,
        updateDeal,
        deleteDeal,
        addCompany,
        updateCompany,
        deleteCompany,
        addReminder,
        updateReminder,
        deleteReminder,
        snoozeReminder,
        completeReminder,
        recomputeScores,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
}

export function useCrm() {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
}
