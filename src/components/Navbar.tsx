import React from 'react';
import {
  Search,
  Plus,
  Grid,
  List,
  Download,
  UserCheck,
  X,
  Database
} from 'lucide-react';
import { ViewMode, FilterOptions } from '../types';

interface NavbarProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  totalContacts: number;
  favoritesCount: number;
  onOpenAddModal: () => void;
  onOpenImportExportModal: () => void;
  onOpenVercelDbModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  filters,
  setFilters,
  viewMode,
  setViewMode,
  totalContacts,
  favoritesCount,
  onOpenAddModal,
  onOpenImportExportModal,
  onOpenVercelDbModal
}) => {
  return (
    <header id="app-header" className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-6">
        {/* Brand & Quick Count */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm ring-1 ring-white/10">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-base sm:text-lg tracking-tight text-white">
              Contacts
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/60 hidden sm:inline-block font-mono">
              {totalContacts}
            </span>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="flex-1 max-w-xs sm:max-w-sm md:max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="global-search-input"
              type="text"
              placeholder="Search contacts..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-9 pr-8 py-1.5 sm:py-2 bg-slate-800/60 border border-slate-700/60 rounded-xl text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/80 transition-all"
            />
            {filters.searchQuery && (
              <button
                id="clear-search-button"
                onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 rounded-md hover:bg-slate-700/60 transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Action Controls & Layout Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Grid/Table Mode Switch */}
          <div className="flex bg-slate-800/80 p-0.5 rounded-xl border border-slate-700/60">
            <button
              id="view-grid-button"
              onClick={() => setViewMode('grid')}
              title="Grid View"
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              id="view-table-button"
              onClick={() => setViewMode('table')}
              title="Table List View"
              className={`p-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Vercel Database Connection Status Button */}
          {onOpenVercelDbModal && (
            <button
              id="vercel-db-modal-button"
              onClick={onOpenVercelDbModal}
              title="Postgres Database Settings & Status"
              className="p-2 sm:px-3 sm:py-1.5 bg-indigo-950/40 hover:bg-indigo-900/40 border border-indigo-500/30 text-indigo-300 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm hover:border-indigo-500/60"
            >
              <Database className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden lg:inline">Postgres DB</span>
            </button>
          )}

          {/* Import / Export Data */}
          <button
            id="import-export-modal-button"
            onClick={onOpenImportExportModal}
            title="Import or Export Contacts"
            className="p-2 sm:px-3 sm:py-1.5 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-200 text-xs font-medium rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-300" />
            <span className="hidden md:inline">Import/Export</span>
          </button>

          {/* Add Contact Primary CTA */}
          <button
            id="add-contact-header-button"
            onClick={onOpenAddModal}
            className="px-3 py-1.5 sm:px-3.5 sm:py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">Add Contact</span>
          </button>
        </div>
      </div>
    </header>
  );
};

