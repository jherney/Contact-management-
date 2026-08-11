import { Contact, FilterOptions } from '../types';

export function getInitials(firstName: string, lastName: string): string {
  const f = firstName ? firstName.charAt(0).toUpperCase() : '';
  const l = lastName ? lastName.charAt(0).toUpperCase() : '';
  return `${f}${l}` || '?';
}

export const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-indigo-600',
  'bg-blue-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-violet-600',
  'bg-cyan-600',
  'bg-teal-600',
  'bg-fuchsia-600',
  'bg-slate-700'
];

export function getRandomAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function filterAndSortContacts(contacts: Contact[], filters: FilterOptions): Contact[] {
  return contacts.filter((contact) => {
    // Search Query (matches name, email, phone, company, title, tags, address)
    if (filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase().trim();
      const fullName = `${contact.firstName} ${contact.lastName}`.toLowerCase();
      const email = contact.email.toLowerCase();
      const phone = contact.phone.toLowerCase();
      const company = contact.company.toLowerCase();
      const jobTitle = contact.jobTitle.toLowerCase();
      const tagsStr = contact.tags.join(' ').toLowerCase();
      const address = (contact.address || '').toLowerCase();

      const matchesSearch =
        fullName.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        company.includes(q) ||
        jobTitle.includes(q) ||
        tagsStr.includes(q) ||
        address.includes(q);

      if (!matchesSearch) return false;
    }

    // Category Filter
    if (filters.category !== 'All' && contact.category !== filters.category) {
      return false;
    }

    // Tag Filter
    if (filters.selectedTag && !contact.tags.includes(filters.selectedTag)) {
      return false;
    }

    // Favorites Filter
    if (filters.favoritesOnly && !contact.isFavorite) {
      return false;
    }

    // Recently Contacted Filter
    if (filters.recentlyContactedOnly && !contact.lastContactedAt) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    const mult = filters.sortOrder === 'asc' ? 1 : -1;

    switch (filters.sortBy) {
      case 'name': {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB) * mult;
      }
      case 'company': {
        const compA = (a.company || '').toLowerCase();
        const compB = (b.company || '').toLowerCase();
        return compA.localeCompare(compB) * mult;
      }
      case 'category': {
        return a.category.localeCompare(b.category) * mult;
      }
      case 'lastContactedAt': {
        const dateA = a.lastContactedAt ? new Date(a.lastContactedAt).getTime() : 0;
        const dateB = b.lastContactedAt ? new Date(b.lastContactedAt).getTime() : 0;
        return (dateA - dateB) * mult;
      }
      case 'createdAt':
      default: {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return (dateA - dateB) * mult;
      }
    }
  });
}

export function exportContactsToCSV(contacts: Contact[]) {
  const headers = [
    'ID',
    'First Name',
    'Last Name',
    'Email',
    'Phone',
    'Company',
    'Job Title',
    'Category',
    'Tags',
    'Address',
    'Website',
    'LinkedIn',
    'Favorite',
    'Notes',
    'Created At'
  ];

  const rows = contacts.map(c => [
    c.id,
    c.firstName,
    c.lastName,
    c.email,
    c.phone,
    c.company,
    c.jobTitle,
    c.category,
    c.tags.join('; '),
    c.address || '',
    c.website || '',
    c.linkedIn || '',
    c.isFavorite ? 'Yes' : 'No',
    c.notes || '',
    c.createdAt
  ]);

  const csvContent = [
    headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `contacts_export_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportContactsToJSON(contacts: Contact[]) {
  const dataStr = JSON.stringify(contacts, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `contacts_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
