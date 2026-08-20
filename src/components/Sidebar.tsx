import React, { useState } from 'react';
import {
  Users,
  Star,
  Clock,
  Tag,
  Briefcase,
  Heart,
  FolderOpen,
  ArrowUpDown,
  Filter,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X
} from 'lucide-react';
import { Contact, ContactCategory, FilterOptions, SortField } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  contacts: Contact[];
  filters: FilterOptions;
  setFilters: (filters: React.SetStateAction<FilterOptions>) => void;
  allTags: string[];
}

const CATEGORY_CONFIG: { label: ContactCategory | 'All'; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { label: 'All', icon: Users, color: 'text-[#fafaf9]/60' },
  { label: 'Work', icon: Briefcase, color: 'text-[#3b82f6]' },
  { label: 'Client', icon: FolderOpen, color: 'text-[#10b981]' },
  { label: 'VIP', icon: Star, color: 'text-[#ff4d00]' },
  { label: 'Family', icon: Heart, color: 'text-[#f43f5e]' },
  { label: 'Personal', icon: Users, color: 'text-[#8b5cf6]' },
  { label: 'Other', icon: Tag, color: 'text-[#fafaf9]/40' }
];

export const Sidebar: React.FC<SidebarProps> = ({
  contacts,
  filters,
  setFilters,
  allTags
}) => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const getCategoryCount = (cat: ContactCategory | 'All') => {
    if (cat === 'All') return contacts.length;
    return contacts.filter((c) => c.category === cat).length;
  };

  const hasActiveFilters =
    filters.category !== 'All' ||
    filters.selectedTag !== null ||
    filters.favoritesOnly ||
    filters.recentlyContactedOnly ||
    filters.searchQuery !== '';

  const activeFiltersCount = [
    filters.category !== 'All',
    filters.selectedTag !== null,
    filters.favoritesOnly,
    filters.recentlyContactedOnly,
    filters.searchQuery !== ''
  ].filter(Boolean).length;

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
    <aside id="sidebar-filters" className="w-full lg:w-72 flex-shrink-0 space-y-5">
      {/* ================= MOBILE CONTROLS (Screen < lg) ================= */}
      <div className="lg:hidden space-y-3">
        {/* Horizontal Category Scroll Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setFilters((prev) => ({ ...prev, category: 'All' }))}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all border ${
              filters.category === 'All'
                ? 'bg-[#ff4d00] text-white border-[#ff4d00] shadow-lg shadow-[#ff4d00]/20'
                : 'bg-[#141414] text-[#fafaf9]/60 border-white/[0.08] hover:border-white/[0.15]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All</span>
            <span className="text-[10px] opacity-75 font-mono px-1.5 py-0.5 rounded-full bg-white/[0.06]">
              {contacts.length}
            </span>
          </motion.button>

          {CATEGORY_CONFIG.filter((c) => c.label !== 'All').map((cat) => {
            const IconComp = cat.icon;
            const count = getCategoryCount(cat.label);
            const isActive = filters.category === cat.label;
            return (
              <motion.button
                key={cat.label}
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    category: isActive ? 'All' : cat.label
                  }))
                }
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold flex-shrink-0 transition-all border ${
                  isActive
                    ? 'bg-[#ff4d00] text-white border-[#ff4d00] shadow-lg shadow-[#ff4d00]/20'
                    : 'bg-[#141414] text-[#fafaf9]/60 border-white/[0.08] hover:border-white/[0.15]'
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : cat.color}`} />
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-75 font-mono px-1.5 py-0.5 rounded-full bg-white/[0.06]">
                  {count}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Filter Toggle Header Bar */}
        <div className="flex items-center justify-between bg-[#141414] border border-white/[0.08] rounded-2xl p-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="flex items-center gap-2.5 text-xs font-bold text-[#fafaf9]"
          >
            <SlidersHorizontal className="w-4 h-4 text-[#ff4d00]" />
            <span>More Filters & Sort</span>
            {activeFiltersCount > 0 && (
              <span className="bg-[#ff4d00] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
            {mobileFiltersOpen ? (
              <ChevronUp className="w-4 h-4 text-[#fafaf9]/40" />
            ) : (
              <ChevronDown className="w-4 h-4 text-[#fafaf9]/40" />
            )}
          </motion.button>

          {hasActiveFilters && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleResetFilters}
              className="text-xs text-[#ff4d00] hover:text-[#ff6a2f] font-bold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </motion.button>
          )}
        </div>

        {/* Mobile Collapsible Panel */}
        <AnimatePresence>
          {mobileFiltersOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="bg-[#141414] border border-white/[0.08] rounded-3xl p-5 space-y-5 overflow-hidden"
            >
              {/* Quick Toggle Views */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#fafaf9]/40 block">
                  Quick Views
                </span>
                <div className="flex flex-col gap-2.5">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setFilters((prev) => ({ ...prev, favoritesOnly: !prev.favoritesOnly }))}
                    className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between border transition-all ${
                      filters.favoritesOnly
                        ? 'bg-[#ff4d00]/10 text-[#ff4d00] border-[#ff4d00]/30'
                        : 'bg-[#0a0a0a] text-[#fafaf9]/60 border-white/[0.08]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Star className={`w-3.5 h-3.5 ${filters.favoritesOnly ? 'fill-[#ff4d00] text-[#ff4d00]' : 'text-[#ff4d00]'}`} />
                      Starred
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.06] font-mono">
                      {contacts.filter((c) => c.isFavorite).length}
                    </span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() =>
                      setFilters((prev) => ({ ...prev, recentlyContactedOnly: !prev.recentlyContactedOnly }))
                    }
                    className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between border transition-all ${
                      filters.recentlyContactedOnly
                        ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30'
                        : 'bg-[#0a0a0a] text-[#fafaf9]/60 border-white/[0.08]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-[#10b981]" />
                      Activity
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-white/[0.06] font-mono">
                      {contacts.filter((c) => c.lastContactedAt).length}
                    </span>
                  </motion.button>
                </div>
              </div>

              {/* Sorting */}
              <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#fafaf9]/40 block">
                  Sort Directory
                </span>
                <div className="space-y-3">
                  <select
                    id="mobile-sort-field-select"
                    value={filters.sortBy}
                    onChange={(e) =>
                      setFilters((prev) => ({ ...prev, sortBy: e.target.value as SortField }))
                    }
                    className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30"
                  >
                    <option value="name">Name (A-Z)</option>
                    <option value="company">Company</option>
                    <option value="category">Category</option>
                    <option value="lastContactedAt">Recently Logged</option>
                    <option value="createdAt">Date Created</option>
                  </select>

                  <div className="space-y-2">
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilters((prev) => ({ ...prev, sortOrder: 'asc' }))}
                      className={`w-full py-2 text-[10px] font-bold rounded-lg text-center transition-all ${
                        filters.sortOrder === 'asc' ? 'bg-[#ff4d00] text-white shadow-lg shadow-[#ff4d00]/20' : 'text-[#fafaf9]/40'
                      }`}
                    >
                      Ascending
                    </motion.button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setFilters((prev) => ({ ...prev, sortOrder: 'desc' }))}
                      className={`w-full py-2 text-[10px] font-bold rounded-lg text-center transition-all ${
                        filters.sortOrder === 'desc' ? 'bg-[#ff4d00] text-white shadow-lg shadow-[#ff4d00]/20' : 'text-[#fafaf9]/40'
                      }`}
                    >
                      Descending
                    </motion.button>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {allTags.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-white/[0.08]">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#fafaf9]/40">
                      Filter by Tag
                    </span>
                    {filters.selectedTag && (
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setFilters((prev) => ({ ...prev, selectedTag: null }))}
                        className="text-[10px] text-[#ff4d00] hover:text-[#ff6a2f] font-bold"
                      >
                        Clear Tag
                      </motion.button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {allTags.map((tag) => {
                      const isSelected = filters.selectedTag === tag;
                      return (
                        <motion.button
                          key={tag}
                          whileTap={{ scale: 0.95 }}
                          onClick={() =>
                            setFilters((prev) => ({
                              ...prev,
                              selectedTag: isSelected ? null : tag
                            }))
                          }
                          className={`text-[11px] px-3 py-1.5 rounded-xl border transition-all ${
                            isSelected
                              ? 'bg-[#ff4d00] border-[#ff4d00] text-white font-bold shadow-lg shadow-[#ff4d00]/20'
                              : 'bg-[#0a0a0a] border-white/[0.08] text-[#fafaf9]/60 hover:border-white/[0.15]'
                          }`}
                        >
                          #{tag}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
          </div>

        {/* ================= DESKTOP SIDEBAR (Screen >= lg) ================= */}
        <div className="hidden lg:block space-y-5">
          {/* Quick Views */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-[#141414] border border-white/[0.08] rounded-3xl p-5 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#fafaf9]/50 flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#ff4d00]" /> Quick Views
              </span>
              {hasActiveFilters && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleResetFilters}
                  className="text-[10px] text-[#ff4d00] hover:text-[#ff6a2f] font-bold flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </motion.button>
              )}
            </div>

            <nav className="space-y-1.5">
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, category: 'All', favoritesOnly: false, recentlyContactedOnly: false }))
                }
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                  filters.category === 'All' && !filters.favoritesOnly && !filters.recentlyContactedOnly
                    ? 'bg-[#ff4d00] text-white shadow-lg shadow-[#ff4d00]/20'
                    : 'text-[#fafaf9]/60 hover:bg-white/[0.04] hover:text-[#fafaf9]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span>All Contacts</span>
                </div>
                <span
                  className={`text-[11px] px-2.5 py-1 rounded-full font-mono ${
                    filters.category === 'All' && !filters.favoritesOnly && !filters.recentlyContactedOnly
                      ? 'bg-white/20 text-white'
                      : 'bg-white/[0.06] text-[#fafaf9]/40'
                  }`}
                >
                  {contacts.length}
                </span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() => setFilters((prev) => ({ ...prev, favoritesOnly: !prev.favoritesOnly }))}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                  filters.favoritesOnly
                    ? 'bg-[#ff4d00]/10 text-[#ff4d00] border border-[#ff4d00]/20'
                    : 'text-[#fafaf9]/60 hover:bg-white/[0.04] hover:text-[#fafaf9]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Star className={`w-4 h-4 ${filters.favoritesOnly ? 'fill-[#ff4d00] text-[#ff4d00]' : 'text-[#ff4d00]'}`} />
                  <span>Star Favorites</span>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.06] text-[#fafaf9]/40 font-mono">
                  {contacts.filter((c) => c.isFavorite).length}
                </span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  setFilters((prev) => ({ ...prev, recentlyContactedOnly: !prev.recentlyContactedOnly }))
                }
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-semibold transition-all ${
                  filters.recentlyContactedOnly
                    ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/20'
                    : 'text-[#fafaf9]/60 hover:bg-white/[0.04] hover:text-[#fafaf9]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-[#10b981]" />
                  <span>Logged Activity</span>
                </div>
                <span className="text-[11px] px-2.5 py-1 rounded-full bg-white/[0.06] text-[#fafaf9]/40 font-mono">
                  {contacts.filter((c) => c.lastContactedAt).length}
                </span>
              </motion.button>
            </nav>
          </motion.div>

          {/* Categories Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-[#141414] border border-white/[0.08] rounded-3xl p-5 shadow-sm space-y-3"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#fafaf9]/50 block pb-3 border-b border-white/[0.08]">
              Categories
            </span>

            <div className="space-y-1.5">
              {CATEGORY_CONFIG
                .filter((c) => c.label !== 'All')
                .map((cat) => {
                  const IconComp = cat.icon;
                  const count = getCategoryCount(cat.label);
                  const isActive = filters.category === cat.label;
                  return (
                    <motion.button
                      key={cat.label}
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          category: isActive ? 'All' : cat.label
                        }))
                      }
                      className={`w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-white/[0.08] text-[#ff4d00] border border-[#ff4d00]/20'
                          : 'text-[#fafaf9]/60 hover:bg-white/[0.04] hover:text-[#fafaf9]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <IconComp className={`w-4 h-4 ${cat.color}`} />
                        <span>{cat.label}</span>
                      </div>
                      <span className="text-[11px] text-[#fafaf9]/30 font-mono">{count}</span>
                    </motion.button>
                  );
                })}
            </div>
          </motion.div>

          {/* Sorting Controls */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-[#141414] border border-white/[0.08] rounded-3xl p-5 shadow-sm space-y-4"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#fafaf9]/50 block pb-3 border-b border-white/[0.08] flex items-center gap-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#ff4d00]" /> Sort Directory
            </span>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-[#fafaf9]/40 block mb-2 uppercase tracking-wider">Sort Field</label>
                <select
                  id="sort-field-select"
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, sortBy: e.target.value as SortField }))
                  }
                  className="w-full bg-[#0a0a0a] border border-white/[0.08] rounded-xl px-4 py-2.5 text-xs text-[#fafaf9] focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30"
                >
                  <option value="name">Name (A - Z)</option>
                  <option value="company">Company Name</option>
                  <option value="category">Category</option>
                  <option value="lastContactedAt">Recently Contacted</option>
                  <option value="createdAt">Date Created</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[#fafaf9]/40 block mb-2 uppercase tracking-wider">Direction</label>
                <div className="flex bg-[#0a0a0a] p-1 rounded-xl border border-white/[0.08]">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilters((prev) => ({ ...prev, sortOrder: 'asc' }))}
                    className={`flex-1 py-2.5 text-[11px] font-bold rounded-lg text-center transition-all ${
                      filters.sortOrder === 'asc'
                        ? 'bg-[#ff4d00] text-white shadow-lg shadow-[#ff4d00]/20'
                        : 'text-[#fafaf9]/40 hover:text-[#fafaf9]'
                    }`}
                  >
                    Ascending
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilters((prev) => ({ ...prev, sortOrder: 'desc' }))}
                    className={`flex-1 py-2.5 text-[11px] font-bold rounded-lg text-center transition-all ${
                      filters.sortOrder === 'desc'
                        ? 'bg-[#ff4d00] text-white shadow-lg shadow-[#ff4d00]/20'
                        : 'text-[#fafaf9]/40 hover:text-[#fafaf9]'
                    }`}
                  >
                    Descending
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Filter by Tags */}
          {allTags.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-[#141414] border border-white/[0.08] rounded-3xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#fafaf9]/50">
                  Tags
                </span>
                {filters.selectedTag && (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilters((prev) => ({ ...prev, selectedTag: null }))}
                    className="text-[10px] text-[#ff4d00] hover:text-[#ff6a2f] font-bold"
                  >
                    Clear Tag
                  </motion.button>
                )}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                {allTags.map((tag) => {
                  const isSelected = filters.selectedTag === tag;
                  return (
                    <motion.button
                      key={tag}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          selectedTag: isSelected ? null : tag
                        }))
                      }
                      className={`text-[11px] px-3 py-1.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'bg-[#ff4d00] border-[#ff4d00] text-white font-bold shadow-lg shadow-[#ff4d00]/20'
                          : 'bg-[#0a0a0a] border-white/[0.08] text-[#fafaf9]/60 hover:border-white/[0.15]'
                      }`}
                    >
                      #{tag}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </aside>
    );
  };
