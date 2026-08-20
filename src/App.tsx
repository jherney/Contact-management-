import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Contact, ViewMode, FilterOptions, InteractionNote, ActiveView } from './types';
import { INITIAL_CONTACTS } from './data/initialContacts';
import { filterAndSortContacts } from './utils/contactUtils';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { ContactCard } from './components/ContactCard';
import { ContactTableRow } from './components/ContactTableRow';
import { ContactDetailModal } from './components/ContactDetailModal';
import { ContactFormModal } from './components/ContactFormModal';
import { ImportExportModal } from './components/ImportExportModal';
import { VercelDatabaseModal } from './components/VercelDatabaseModal';
import { ViewNavigation } from './components/ViewNavigation';
import { TasksPage } from './components/TasksPage';
import { DealsPage } from './components/DealsPage';
import { CompaniesPage } from './components/CompaniesPage';
import { RemindersCenter } from './components/RemindersCenter';
import { ReportsPage } from './components/ReportsPage';
import { saveContactsToDatabase, fetchRemoteContacts } from './services/vercelDatabase';
import { useAuth } from './contexts/AuthContext';
import { useCrm } from './contexts/CrmContext';
import { Users, Plus, Search, Filter, RotateCcw, Sparkles, CheckCircle2, AlertCircle, LogIn } from 'lucide-react';
import Lenis from 'lenis';
import { motion, AnimatePresence } from 'motion/react';

const LOCAL_STORAGE_KEY = 'contact_management_system_data_v1';

export default function App() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { setContactsForScoring, loadAll } = useCrm();
  const [activeView, setActiveView] = useState<ActiveView>('directory');
  const [pageLoaded, setPageLoaded] = useState(false);
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

  const [contactsMigrated, setContactsMigrated] = useState(false);

  // Lenis smooth scroll
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !lenisRef.current) {
      lenisRef.current = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });

      function raf(time: number) {
        lenisRef.current?.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    }

    return () => {
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Page load choreography
  useEffect(() => {
    const timer = setTimeout(() => setPageLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    saveContactsToDatabase(contacts);
    setContactsForScoring(contacts);
  }, [contacts, setContactsForScoring]);

  useEffect(() => {
    fetchRemoteContacts().then((remote) => {
      if (remote && remote.length > 0) {
        setContacts(remote);
      }
    });
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadAll().catch(console.error);
    }
  }, [isAuthenticated, loadAll]);

  useEffect(() => {
    if (isAuthenticated && user && !contactsMigrated) {
      setContacts((prev) => {
        const needsMigration = prev.some(c => !c.userId || c.userId === 'local-user');
        if (!needsMigration) return prev;
        
        const migrated = prev.map(c => ({
          ...c,
          userId: c.userId || user.id,
          user_id: c.userId || user.id
        }));
        setContactsMigrated(true);
        return migrated;
      });
    }
  }, [isAuthenticated, user, contactsMigrated]);

  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    category: 'All',
    selectedTag: null,
    favoritesOnly: false,
    recentlyContactedOnly: false,
    sortBy: 'name',
    sortOrder: 'asc'
  });

  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportExportModalOpen, setIsImportExportModalOpen] = useState(false);
  const [isVercelDbModalOpen, setIsVercelDbModalOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3000);
  };

  const allTags = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => {
      if (c.tags) {
        c.tags.forEach((t) => set.add(t));
      }
    });
    return Array.from(set).sort();
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    return filterAndSortContacts(contacts, filters);
  }, [contacts, filters]);

  const favoritesCount = useMemo(() => {
    return contacts.filter((c) => c.isFavorite).length;
  }, [contacts]);

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

    if (selectedContact && selectedContact.id === id) {
      setSelectedContact((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  const handleDeleteContact = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const contactToDelete = contacts.find((c) => c.id === id);
    
    try {
      const res = await fetch(`/api/contacts/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (res.ok || res.status === 404) {
        setContacts((prev) => prev.filter((c) => c.id !== id));
        if (selectedContact?.id === id) {
          setSelectedContact(null);
        }
        showToast(`Deleted ${contactToDelete ? contactToDelete.firstName : 'contact'}`);
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to delete contact');
      }
    } catch (err) {
      setContacts((prev) => prev.filter((c) => c.id !== id));
      if (selectedContact?.id === id) {
        setSelectedContact(null);
      }
      showToast(`Deleted ${contactToDelete ? contactToDelete.firstName : 'contact'}`);
    }
  };

  const handleOpenAddModal = () => {
    if (!isAuthenticated) {
      showToast('Please sign in to add contacts');
      return;
    }
    setEditingContact(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (contact: Contact, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!isAuthenticated) {
      showToast('Please sign in to edit contacts');
      return;
    }
    setEditingContact(contact);
    setIsFormModalOpen(true);
  };

  const handleSaveContact = (
    data: Omit<Contact, 'id' | 'createdAt' | 'updatedAt' | 'interactions'>,
    existingId?: string
  ) => {
    const now = new Date().toISOString();
    const userId = user?.id || 'local-user';

    const contactData = {
      ...data,
      userId: existingId ? (data as any).userId : userId,
      user_id: existingId ? (data as any).userId : userId
    };

    if (existingId) {
      setContacts((prev) =>
        prev.map((c) => {
          if (c.id === existingId) {
            const updated = {
              ...c,
              ...contactData,
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
      const newContact: Contact = {
        ...contactData,
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

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#fafaf9] flex items-center justify-center">
        <div className="text-center space-y-6">
          <motion.div
            className="w-16 h-16 rounded-2xl bg-[#ff4d00] flex items-center justify-center text-white shadow-lg mx-auto auth-loading-pulse"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Users className="w-8 h-8" />
          </motion.div>
          <p className="text-sm text-[#fafaf9]/60 font-medium tracking-wide">Loading your network...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#fafaf9] flex flex-col font-sans selection:bg-[#ff4d00] selection:text-[#0a0a0a]">
      {/* Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            id="app-toast-banner"
            initial={{ opacity: 0, y: 20, x: 100 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 20, x: 100 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 right-6 z-50 bg-[#141414] border border-[#ff4d00]/30 text-[#fafaf9] text-xs font-semibold px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3"
          >
            <CheckCircle2 className="w-4 h-4 text-[#10b981] flex-shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: pageLoaded ? 1 : 0, y: pageLoaded ? 0 : -20 }}
        transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <Navbar
          filters={filters}
          setFilters={setFilters}
          viewMode={viewMode}
          setViewMode={setViewMode}
          totalContacts={contacts.length}
          favoritesCount={favoritesCount}
          onOpenAddModal={handleOpenAddModal}
          onOpenImportExportModal={() => setIsImportExportModalOpen(true)}
          onOpenVercelDbModal={() => setIsVercelDbModalOpen(true)}
        />
      </motion.div>

      {/* Main Content Layout */}
      <main className="w-full flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* View Navigation */}
        <motion.div
          id="view-navigation-wrapper"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: pageLoaded ? 1 : 0, y: pageLoaded ? 0 : -20 }}
          transition={{ duration: 0.5, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <ViewNavigation activeView={activeView} setActiveView={setActiveView} />
        </motion.div>

        {/* CRM Views (non-directory) */}
        {activeView !== 'directory' && (
          <motion.section
            id="crm-view-content"
            key={activeView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 min-w-0"
          >
            {activeView === 'tasks' && <TasksPage contacts={contacts} />}
            {activeView === 'deals' && <DealsPage contacts={contacts} />}
            {activeView === 'companies' && <CompaniesPage contacts={contacts} />}
            {activeView === 'reminders' && <RemindersCenter contacts={contacts} />}
            {activeView === 'reports' && <ReportsPage contacts={contacts} />}
          </motion.section>
        )}

{/* Directory View (with sidebar) */}
        {activeView === 'directory' && (
          <>
            <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 w-full">
              {/* Sidebar - Filters */}
              <Sidebar
                contacts={contacts}
                filters={filters}
                setFilters={setFilters}
                allTags={allTags}
              />

              {/* Directory Results View */}
              <section id="directory-content" className="flex-1 min-w-0 space-y-5">
              {/* Section Header with result count */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: pageLoaded ? 1 : 0, y: pageLoaded ? 0 : 20 }}
                transition={{ duration: 0.6, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center justify-between pb-4 border-b border-white/[0.08]"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-bold text-[#fafaf9] tracking-tight" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)' }}>
                    {filters.category !== 'All' ? `${filters.category} Contacts` : 'Directory'}
                  </h2>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-white/[0.06] text-[#fafaf9]/60 font-mono border border-white/[0.08]">
                    {filteredContacts.length} {filteredContacts.length === 1 ? 'contact' : 'contacts'}
                  </span>
                </div>

            {filters.selectedTag && (
              <span className="text-xs bg-[#ff4d00]/10 text-[#ff4d00] border border-[#ff4d00]/20 px-3 py-1 rounded-xl font-semibold">
                Tag: #{filters.selectedTag}
              </span>
            )}
            </motion.div>

          {/* Auth Prompt for Unauthenticated users */}
          {!isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="p-8 bg-[#ff4d00]/[0.04] border border-[#ff4d00]/20 rounded-3xl flex items-center justify-between gap-6"
            >
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-[#ff4d00]/10 flex items-center justify-center text-[#ff4d00] flex-shrink-0">
                  <LogIn className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#fafaf9] mb-1" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
                    Sign in to manage contacts
                  </h3>
                  <p className="text-sm text-[#fafaf9]/60 leading-relaxed">
                    Create an account or log in to add, edit, and sync your contacts across devices.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Directory Rendering */}
          <AnimatePresence mode="wait">
            {filteredContacts.length > 0 ? (
              viewMode === 'grid' ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  id="contact-grid-container"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5"
                >
                  {filteredContacts.map((contact, index) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        delay: Math.min(index * 0.05, 0.5),
                        ease: [0.16, 1, 0.3, 1]
                      }}
                    >
                      <ContactCard
                        contact={contact}
                        onSelect={handleContactClick}
                        onToggleFavorite={handleToggleFavorite}
                        onEdit={handleOpenEditModal}
                        onDelete={handleDeleteContact}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <motion.div
                  key="table"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  id="contact-table-container"
                  className="bg-[#141414] border border-white/[0.08] rounded-3xl overflow-hidden shadow-sm"
                >
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white/[0.03] text-[11px] font-bold text-[#fafaf9]/50 uppercase tracking-widest border-b border-white/[0.08]">
                            <th className="py-4 px-5 w-12 text-center">Fav</th>
                            <th className="py-4 px-5">Contact</th>
                            <th className="py-4 px-5 hidden md:table-cell">Company</th>
                            <th className="py-4 px-5">Category</th>
                            <th className="py-4 px-5 hidden lg:table-cell">Reach Out</th>
                            <th className="py-4 px-5 hidden xl:table-cell">Last Log</th>
                            <th className="py-4 px-5 text-right">Actions</th>
                          </tr>
                        </thead>
                      <tbody>
                        {filteredContacts.map((contact, index) => (
                          <motion.tr
                            key={contact.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              duration: 0.4,
                              delay: Math.min(index * 0.03, 0.4),
                              ease: [0.16, 1, 0.3, 1]
                            }}
                          >
                            <ContactTableRow
                              contact={contact}
                              onSelect={handleContactClick}
                              onToggleFavorite={handleToggleFavorite}
                              onEdit={handleOpenEditModal}
                              onDelete={handleDeleteContact}
                            />
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                id="empty-directory-state"
                className="py-20 text-center bg-[#141414] border border-white/[0.08] rounded-3xl space-y-6 my-8"
              >
                <div className="w-20 h-20 rounded-3xl bg-white/[0.06] text-[#ff4d00] flex items-center justify-center mx-auto shadow-inner">
                  <Users className="w-9 h-9" />
                </div>
                <div className="space-y-2 max-w-sm mx-auto">
                  <h3 className="text-xl font-bold text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)' }}>
                    No contacts found
                  </h3>
                  <p className="text-sm text-[#fafaf9]/50 leading-relaxed">
                    {contacts.length === 0
                      ? 'Your directory is currently empty. Start by creating a new contact or importing backup data.'
                      : 'No contacts matched your search or category filters. Try clearing your filters.'}
                  </p>
                </div>

                <div className="flex items-center justify-center gap-3 pt-2">
                  {contacts.length > 0 ? (
                    <motion.button
                      id="empty-reset-filters-btn"
                      onClick={handleResetFilters}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-[#fafaf9] text-xs font-semibold rounded-2xl border border-white/[0.08] transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Clear Search Filters</span>
                    </motion.button>
                  ) : (
                    <motion.button
                      id="empty-add-contact-btn"
                      onClick={handleOpenAddModal}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-5 py-2.5 bg-[#ff4d00] hover:bg-[#ff6a2f] text-white text-xs font-semibold rounded-2xl transition-all shadow-lg shadow-[#ff4d00]/20 flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Your First Contact</span>
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )}
</AnimatePresence>
            </section>
          </div>
          </>
        )}
      </main>

      {/* Mobile Floating Action Button */}
      {isAuthenticated && (
        <motion.button
          id="mobile-fab-add-contact"
          onClick={handleOpenAddModal}
          title="Add New Contact"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, type: "spring", stiffness: 200, damping: 15 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="sm:hidden fixed bottom-7 right-5 z-40 w-14 h-14 rounded-full bg-[#ff4d00] hover:bg-[#ff6a2f] text-white shadow-2xl shadow-[#ff4d00]/30 flex items-center justify-center transition-all active:scale-95 ring-2 ring-[#ff4d00]/30"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </motion.button>
      )}

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

      <VercelDatabaseModal
        isOpen={isVercelDbModalOpen}
        onClose={() => setIsVercelDbModalOpen(false)}
        contacts={contacts}
        onContactsUpdated={setContacts}
        showToast={showToast}
      />
    </div>
  );
}
