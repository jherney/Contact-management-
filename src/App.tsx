import React, { useState, useEffect, useMemo } from 'react';
import {
  Contact,
  ViewMode,
  FilterOptions,
  InteractionNote,
  ContactCategory
} from './types';
import { INITIAL_CONTACTS } from './data/initialContacts';
import { filterAndSortContacts } from './utils/contactUtils';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ContactCard } from './components/ContactCard';
import { ContactTableRow } from './components/ContactTableRow';
import { ContactDetailModal } from './components/ContactDetailModal';
import { ContactFormModal } from './components/ContactFormModal';
import { ImportExportModal } from './components/ImportExportModal';
import {
  Users,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

const LOCAL_STORAGE_KEY = 'contact_management_system_data_v1';

export default function App() {
  // Load contacts from localStorage or initialize with sample data
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to parse contacts from localStorage', e);
    }
    return INITIAL_CONTACTS;
  });

  // Save contacts to localStorage on state change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(contacts));
    } catch (e) {
      console.error('Failed to save contacts to localStorage', e);
    }
  }, [contacts]);

  // View Mode: 'grid' | 'table'
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Filter & Search State
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    category: 'All',
    selectedTag: null,
    favoritesOnly: false,
    recentlyContactedOnly: false,
    sortBy: 'name',
    sortOrder: 'asc'
  });

  // Modal States
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  // Derive all unique tags across contacts
  const allTags = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => {
      if (c.tags) {
        c.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set).sort();
  }, [contacts]);

  // Filtered & Sorted Contacts List
  const filteredContacts = useMemo(() => {
    return filterAndSortContacts(contacts, filters);
  }, [contacts, filters]);

  const favoritesCount = useMemo(() => {
    return contacts.filter((c) => c.isFavorite).length;
  }, [contacts]);

  // Actions
  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextFav = !c.isFavorite;
          showToast(nextFav ? `Starred ${c.firstName} to favorites` : `Removed ${c.firstName} from favorites`);
          return { ...c, isFavorite: nextFav, updatedAt: new Date().toISOString() };
        }
        return c;
      })
    );

    // Keep detail view in sync if open
    if (selectedContact && selectedContact.id === id) {
      setSelectedContact((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  const handleDeleteContact = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const contactToDelete = contacts.find((c) => c.id === id);
    setContacts((prev) => prev.filter((c) => c.id !== id));
    if (selectedContact?.id === id) {
      setSelectedContact(null);
    }
    showToast(`Deleted ${contactToDelete ? contactToDelete.firstName : 'contact'}`);
  };

  const handleOpenAddModal = () => {
    setEditingContact(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (contact: Contact, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingContact(contact);
    setIsFormModalOpen(true);
  };

  const handleSaveContact = (
    data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();

    if (existingId) {
      // Update
      setContacts((prev) =>
        prev.map((c) => {
          if (c.id === existingId) {
            const updated = {
              ...c,
              ...data,
              updatedAt: now
            };
            if (selectedContact?.id === existingId) {
              setSelectedContact(updated);
            }
            return updated;
          }
          return c;
        })
      );
      showToast(`Updated contact details for ${data.firstName}`);
    } else {
      // Create
      const newContact: Contact = {
        ...data,
        id: `contact-${Date.now()}`,
        interactions: [],
        createdAt: now,
        updatedAt: now
      };
      setContacts((prev) => [newContact, ...prev]);
      showToast(`Added ${data.firstName} ${data.lastName} to contacts`);
    }
  };

  const handleAddInteraction = (contactId: string, note: InteractionNote) => {
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id === contactId) {
          const updatedInteractions = [note, ...(c.interactions || [])];
          const updated = {
            ...c,
            interactions: updatedInteractions,
            lastContactedAt: note.date,
            updatedAt: new Date().toISOString()
          };
          if (selectedContact?.id === contactId) {
            setSelectedContact(updated);
          }
          return updated;
        }
        return c;
      })
    );
    showToast(`Logged new ${note.type} interaction`);
  };

  const handleDeleteInteraction = (contactId: string, interactionId: string) => {
    setContacts((prev) =>
      prev.map((c) => {
        if (c.id === contactId) {
          const updatedInteractions = c.interactions.filter((i) => i.id !== interactionId);
          const nextLastContacted =
            updatedInteractions.length > 0 ? updatedInteractions[0].date : undefined;
          const updated = {
            ...c,
            interactions: updatedInteractions,
            lastContactedAt: nextLastContacted,
            updatedAt: new Date().toISOString()
          };
          if (selectedContact?.id === contactId) {
            setSelectedContact(updated);
          }
          return updated;
        }
        return c;
      })
    );
    showToast('Deleted interaction log');
  };

  const handleImportContacts = (importedContacts: Contact[], strategy: 'skip' | 'replace' | 'allow' = 'skip') => {
    setContacts((prev) => {
      if (strategy === 'replace') {
        const importedMap = new Map(importedContacts.map(c => [c.id, c]));
        const updatedPrev = prev.map(c => importedMap.get(c.id) || c);
        const prevIds = new Set(prev.map(c => c.id));
        const brandNew = importedContacts.filter(c => !prevIds.has(c.id));
        return [...brandNew, ...updatedPrev];
      }

      const existingIds = new Set(prev.map((c) => c.id));
      const newOnly = importedContacts.filter((c) => !existingIds.has(c.id));
      return [...newOnly, ...prev];
    });
    showToast(`Processed ${importedContacts.length} contacts import`);
  };

  const handleResetFilters = () => {
    setFilters({
      searchQuery: '',
      category: 'All',
      selectedTag: null,
      favoritesOnly: false,
      recentlyContactedOnly: false,
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Toast Banner */}
      {toastMessage && (
        <div
          id="app-toast-banner"
          className="fixed bottom-5 right-5 z-50 bg-slate-900 border border-indigo-500/50 text-slate-100 text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-bounce"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Navbar
        filters={filters}
        setFilters={setFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
        totalContacts={contacts.length}
        favoritesCount={favoritesCount}
        onOpenAddModal={handleOpenAddModal}
        onOpenImportExportModal={() => setIsImportExportModalOpen(true)}
      />

      {/* Main Content Layout */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex-1 flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Sidebar Filters */}
        <Sidebar
          contacts={contacts}
          filters={filters}
          setFilters={setFilters}
          allTags={allTags}
        />

        {/* Directory Results View */}
        <section id="directory-content" className="flex-1 min-w-0 space-y-4">
          {/* Section Header with result count */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-200">
                {filters.category !== 'All' ? `${filters.category} Contacts` : 'Directory'}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono">
                {filteredContacts.length} {filteredContacts.length === 1 ? 'contact' : 'contacts'}
              </span>
            </div>

            {filters.selectedTag && (
              <span className="text-xs bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-md font-semibold">
                Tag: #{filters.selectedTag}
              </span>
            )}
          </div>

          {/* Directory Rendering */}
          {filteredContacts.length > 0 ? (
            viewMode === 'grid' ? (
              <div
                id="contact-grid-container"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4"
              >
                {filteredContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onSelect={setSelectedContact}
                    onToggleFavorite={handleToggleFavorite}
                    onEdit={handleOpenEditModal}
                    onDelete={handleDeleteContact}
                  />
                ))}
              </div>
            ) : (
              <div
                id="contact-table-container"
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-800/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                        <th className="py-3 px-4 w-10 text-center">Fav</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4 hidden md:table-cell">Company</th>
                        <th className="py-3 px-4">Category</th>
                        <th className="py-3 px-4 hidden lg:table-cell">Reach Out</th>
                        <th className="py-3 px-4 hidden xl:table-cell">Last Log</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContacts.map((contact) => (
                        <ContactTableRow
                          key={contact.id}
                          contact={contact}
                          onSelect={setSelectedContact}
                          onToggleFavorite={handleToggleFavorite}
                          onEdit={handleOpenEditModal}
                          onDelete={handleDeleteContact}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          ) : (
            /* Empty State */
            <div
              id="empty-directory-state"
              className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl space-y-4 my-8"
            >
              <div className="w-12 h-12 rounded-2xl bg-slate-800 text-indigo-400 flex items-center justify-center mx-auto shadow-inner">
                <Users className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-200">No contacts found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {contacts.length === 0
                    ? 'Your directory is currently empty. Start by creating a new contact or importing backup data.'
                    : 'No contacts matched your search or category filters. Try clearing your filters.'}
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                {contacts.length > 0 ? (
                  <button
                    id="empty-reset-filters-btn"
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Clear Search Filters</span>
                  </button>
                ) : (
                  <button
                    id="empty-add-contact-btn"
                    onClick={handleOpenAddModal}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create Your First Contact</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Mobile Floating Action Button */}
      <button
        id="mobile-fab-add-contact"
        onClick={handleOpenAddModal}
        title="Add New Contact"
        className="sm:hidden fixed bottom-6 right-5 z-40 w-13 h-13 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/40 flex items-center justify-center transition-all active:scale-95 ring-2 ring-indigo-400/30"
      >
        <Plus className="w-6 h-6 stroke-[2.5]" />
      </button>

      {/* Modals */}
      <ContactDetailModal
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onToggleFavorite={handleToggleFavorite}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteContact}
        onAddInteraction={handleAddInteraction}
        onDeleteInteraction={handleDeleteInteraction}
      />

      <ContactFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingContact(null);
        }}
        onSave={handleSaveContact}
        initialContact={editingContact}
        existingContacts={contacts}
      />

      <ImportExportModal
        isOpen={isImportExportModalOpen}
        onClose={() => setIsImportExportModalOpen(false)}
        contacts={contacts}
        onImportContacts={handleImportContacts}
      />
    </div>
  );
}
