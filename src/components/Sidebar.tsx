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

interface SidebarProps {
  contacts: Contact[];
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  allTags: string[];
}

const CATEGORY_CONFIG: { label: ContactCategory | 'All'; icon: React.ComponentType<{ className?: string }>; color: string }[] = [
  { label: 'All', icon: Users, color: 'text-slate-400' },
  { label: 'Work', icon: Briefcase, color: 'text-indigo-400' },
  { label: 'Client', icon: FolderOpen, color: 'text-emerald-400' },
  { label: 'VIP', icon: Star, color: 'text-amber-400' },
  { label: 'Family', icon: Heart, color: 'text-rose-400' },
  { label: 'Personal', icon: Users, color: 'text-blue-400' },
  { label: 'Other', icon: Tag, color: 'text-slate-400' }
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
    <aside id="sidebar-filters" className="w-full lg:w-64 flex-shrink-0">
      {/* ================= MOBILE CONTROLS (Screen < lg) ================= */}
      <div className="lg:hidden space-y-3 mb-2">
        {/* Horizontal Category Scroll Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            id="mobile-cat-all"
            onClick={() => setFilters((prev) => ({ ...prev, category: 'All' }))}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all border ${
              filters.category === 'All'
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All</span>
            <span className="text-[10px] opacity-75 font-mono px-1.5 py-0.2 rounded-full bg-slate-950/40">
              {contacts.length}
            </span>
          </button>

          {CATEGORY_CONFIG.filter((c) => c.label !== 'All').map((cat) => {
            const IconComp = cat.icon;
            const count = getCategoryCount(cat.label);
            const isActive = filters.category === cat.label;
            return (
              <button
                key={cat.label}
                id={`mobile-cat-${cat.label.toLowerCase()}`}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    category: isActive ? 'All' : cat.label
                  }))
                }
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0 transition-all border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-white' : cat.color}`} />
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-75 font-mono px-1.5 py-0.2 rounded-full bg-slate-950/40">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Toggle Header Bar */}
        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm">
          <button
            id="mobile-toggle-filters-btn"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="flex items-center gap-2 text-xs font-bold text-slate-200"
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
            <span>More Filters & Sort</span>
            {activeFiltersCount > 0 && (
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
            {mobileFiltersOpen ? (
              <ChevronUp className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            )}
          </button>

          {hasActiveFilters && (
            <button
              id="mobile-reset-filters-btn"
              onClick={handleResetFilters}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        {/* Mobile Collapsible Panel */}
        {mobileFiltersOpen && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4 shadow-xl animate-in fade-in duration-150">
            {/* Quick Toggle Views */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Quick Views
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="mobile-filter-favorites"
                  onClick={() => setFilters((prev) => ({ ...prev, favoritesOnly: !prev.favoritesOnly }))}
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between border ${
                    filters.favoritesOnly
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Star className={`w-3.5 h-3.5 ${filters.favoritesOnly ? 'fill-amber-400 text-amber-400' : 'text-amber-400'}`} />
                    Starred
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-950/40 font-mono">
                    {contacts.filter((c) => c.isFavorite).length}
                  </span>
                </button>

                <button
                  id="mobile-filter-recent"
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, recentlyContactedOnly: !prev.recentlyContactedOnly }))
                  }
                  className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-between border ${
                    filters.recentlyContactedOnly
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    Activity
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-950/40 font-mono">
                    {contacts.filter((c) => c.lastContactedAt).length}
                  </span>
                </button>
              </div>
            </div>

            {/* Sorting */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Sort Directory
              </span>
              <div className="grid grid-cols-2 gap-2">
                <select
                  id="mobile-sort-field-select"
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, sortBy: e.target.value as SortField }))
                  }
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="name">Name (A-Z)</option>
                  <option value="company">Company</option>
                  <option value="category">Category</option>
                  <option value="lastContactedAt">Recently Logged</option>
                  <option value="createdAt">Date Created</option>
                </select>

                <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700">
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, sortOrder: 'asc' }))}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg text-center ${
                      filters.sortOrder === 'asc' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Asc
                  </button>
                  <button
                    onClick={() => setFilters((prev) => ({ ...prev, sortOrder: 'desc' }))}
                    className={`flex-1 py-1 text-[10px] font-bold rounded-lg text-center ${
                      filters.sortOrder === 'desc' ? 'bg-indigo-600 text-white' : 'text-slate-400'
                    }`}
                  >
                    Desc
                  </button>
                </div>
              </div>
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Filter by Tag
                  </span>
                  {filters.selectedTag && (
                    <button
                      onClick={() => setFilters((prev) => ({ ...prev, selectedTag: null }))}
                      className="text-[10px] text-indigo-400 hover:underline"
                    >
                      Clear Tag
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((tag) => {
                    const isSelected = filters.selectedTag === tag;
                    return (
                      <button
                        key={tag}
                        onClick={() =>
                          setFilters((prev) => ({
                            ...prev,
                            selectedTag: isSelected ? null : tag
                          }))
                        }
                        className={`text-[11px] px-2.5 py-1 rounded-lg border ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-500 text-white font-semibold'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        #{tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ================= DESKTOP SIDEBAR (Screen >= lg) ================= */}
      <div className="hidden lg:block space-y-6">
        {/* Quick Views */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-400" /> Quick Views
            </span>
            {hasActiveFilters && (
              <button
                id="reset-filters-button"
                onClick={handleResetFilters}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            )}
          </div>

          <nav className="space-y-1">
            <button
              id="filter-all-contacts"
              onClick={() =>
                setFilters((prev) => ({ ...prev, category: 'All', favoritesOnly: false, recentlyContactedOnly: false }))
              }
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                filters.category === 'All' && !filters.favoritesOnly && !filters.recentlyContactedOnly
                  ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>All Contacts</span>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full ${
                  filters.category === 'All' && !filters.favoritesOnly && !filters.recentlyContactedOnly
                    ? 'bg-indigo-700/80 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {contacts.length}
              </span>
            </button>

            <button
              id="filter-favorites-only"
              onClick={() => setFilters((prev) => ({ ...prev, favoritesOnly: !prev.favoritesOnly }))}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                filters.favoritesOnly
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className={`w-4 h-4 ${filters.favoritesOnly ? 'fill-amber-400 text-amber-400' : 'text-amber-400'}`} />
                <span>Star Favorites</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {contacts.filter((c) => c.isFavorite).length}
              </span>
            </button>

            <button
              id="filter-recently-contacted"
              onClick={() =>
                setFilters((prev) => ({ ...prev, recentlyContactedOnly: !prev.recentlyContactedOnly }))
              }
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                filters.recentlyContactedOnly
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Logged Activity</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {contacts.filter((c) => c.lastContactedAt).length}
              </span>
            </button>
          </nav>
        </div>

        {/* Categories Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-800">
            Categories
          </span>

          <div className="space-y-1">
            {CATEGORY_CONFIG
              .filter((c) => c.label !== 'All')
              .map((cat) => {
                const IconComp = cat.icon;
                const count = getCategoryCount(cat.label);
                const isActive = filters.category === cat.label;
                return (
                  <button
                    key={cat.label}
                    id={`category-filter-${cat.label.toLowerCase()}`}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        category: isActive ? 'All' : cat.label
                      }))
                    }
                    className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-slate-800 text-indigo-400 border border-slate-700 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComp className={`w-4 h-4 ${cat.color}`} />
                      <span>{cat.label}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">{count}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* Sorting Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-800 flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" /> Sort Directory
          </span>

          <div className="space-y-2">
            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Sort Field</label>
              <select
                id="sort-field-select"
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, sortBy: e.target.value as SortField }))
                }
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="name">Name (A - Z)</option>
                <option value="company">Company Name</option>
                <option value="category">Category</option>
                <option value="lastContactedAt">Recently Contacted</option>
                <option value="createdAt">Date Created</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-medium text-slate-400 block mb-1">Direction</label>
              <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  id="sort-order-asc"
                  onClick={() => setFilters((prev) => ({ ...prev, sortOrder: 'asc' }))}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-lg text-center transition-colors ${
                    filters.sortOrder === 'asc'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Ascending
                </button>
                <button
                  id="sort-order-desc"
                  onClick={() => setFilters((prev) => ({ ...prev, sortOrder: 'desc' }))}
                  className={`flex-1 py-1 text-[11px] font-semibold rounded-lg text-center transition-colors ${
                    filters.sortOrder === 'desc'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Descending
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter by Tags */}
        {allTags.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-800 flex items-center justify-between">
              <span>Tags</span>
              {filters.selectedTag && (
                <button
                  id="clear-tag-filter"
                  onClick={() => setFilters((prev) => ({ ...prev, selectedTag: null }))}
                  className="text-[10px] text-indigo-400 hover:underline capitalize"
                >
                  Clear Tag
                </button>
              )}
            </span>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {allTags.map((tag) => {
                const isSelected = filters.selectedTag === tag;
                return (
                  <button
                    key={tag}
                    id={`tag-filter-${tag.replace(/\s+/g, '-').toLowerCase()}`}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        selectedTag: isSelected ? null : tag
                      }))
                    }
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white font-semibold shadow-sm'
                        : 'bg-slate-800 border-slate-700/80 text-slate-300 hover:bg-slate-700/80 hover:text-white'
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

