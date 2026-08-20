export type ContactCategory = 'Work' | 'Personal' | 'Client' | 'Family' | 'VIP' | 'Other';

export interface InteractionNote {
  id: string;
  type: 'Call' | 'Email' | 'Meeting' | 'Note' | 'Follow-up';
  date: string;
  summary: string;
  details?: string;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface Contact {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  secondaryPhone?: string;
  company: string;
  jobTitle: string;
  category: ContactCategory;
  tags: string[];
  avatarBgColor?: string;
  avatarUrl?: string;
  isFavorite: boolean;
  address?: string;
  website?: string;
  linkedIn?: string;
  notes?: string;
  customFields?: CustomField[];
  interactions: InteractionNote[];
  createdAt: string;
  updatedAt: string;
  lastContactedAt?: string;
}

export type ViewMode = 'grid' | 'table';

export type SortField = 'name' | 'company' | 'category' | 'createdAt' | 'lastContactedAt';
export type SortOrder = 'asc' | 'desc';

export interface FilterOptions {
  searchQuery: string;
  category: ContactCategory | 'All';
  selectedTag: string | null;
  favoritesOnly: boolean;
  recentlyContactedOnly: boolean;
  sortBy: SortField;
  sortOrder: SortOrder;
}

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  userAgent?: string;
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  dueDate?: string;
  completedAt?: string;
  status: TaskStatus;
  priority: TaskPriority;
  contactId?: string;
  dealId?: string;
  createdAt: string;
  updatedAt: string;
}

export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface Deal {
  id: string;
  userId: string;
  title: string;
  value: number;
  stage: DealStage;
  probability: number;
  expectedCloseDate?: string;
  notes?: string;
  contactId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  userId: string;
  name: string;
  industry?: string;
  size?: string;
  website?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type ReminderType = 'follow_up' | 'birthday' | 'anniversary' | 'custom';
export type ReminderStatus = 'active' | 'completed' | 'snoozed';

export interface Reminder {
  id: string;
  userId: string;
  contactId?: string;
  dealId?: string;
  type: ReminderType;
  title: string;
  message: string;
  remindAt: string;
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  status: ReminderStatus;
  createdAt: string;
  updatedAt: string;
  snoozedUntil?: string;
}

export type LeadScoreTier = 'cold' | 'warm' | 'hot' | 'vip';

export interface LeadScore {
  contactId: string;
  score: number;
  tier: LeadScoreTier;
  lastCalculatedAt: string;
}

export type ActiveView =
  | 'directory'
  | 'tasks'
  | 'deals'
  | 'companies'
  | 'reminders'
  | 'reports';
