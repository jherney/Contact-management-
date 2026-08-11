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
