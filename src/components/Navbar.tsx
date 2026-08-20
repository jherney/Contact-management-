import React from 'react';
import {
  Search,
  Plus,
  Grid,
  List,
  Download,
  UserCheck,
  X,
  Database,
  LogIn,
  LogOut,
  User as UserIcon,
  Menu
} from 'lucide-react';
import { ViewMode, FilterOptions } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { motion, AnimatePresence } from 'motion/react';

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
  const { user, isAuthenticated, logout } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [authModalMode, setAuthModalMode] = React.useState<'login' | 'register'>('login');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const openLogin = () => {
    setAuthModalMode('login');
    setIsAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  const openRegister = () => {
    setAuthModalMode('register');
    setIsAuthModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  return (
    <header id="app-header" className="sticky top-0 z-30 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/[0.08] text-[#fafaf9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4 sm:gap-6">
        {/* Brand — Asymmetric offset on desktop */}
        <motion.div 
          className="flex items-center gap-4 shrink-0 lg:ml-[8.33%]"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="w-10 h-10 rounded-xl bg-[#ff4d00] flex items-center justify-center text-white shadow-lg shadow-[#ff4d00]/20 ring-1 ring-white/10">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-lg tracking-tight text-[#fafaf9]" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)' }}>
              Contacts
            </h1>
            <p className="text-[10px] text-[#fafaf9]/40 font-medium tracking-wider uppercase -mt-0.5">
              {totalContacts} {totalContacts === 1 ? 'entry' : 'entries'}
            </p>
          </div>
        </motion.div>

        {/* Global Search Bar */}
        <motion.div 
          className="flex-1 max-w-md hidden md:block"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fafaf9]/40 group-focus-within:text-[#ff4d00] transition-colors" />
            <input
              id="global-search-input"
              type="text"
              placeholder="Search by name, email, company..."
              value={filters.searchQuery}
              onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
              className="w-full pl-11 pr-10 py-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 focus:border-[#ff4d00]/30 transition-all"
            />
            {filters.searchQuery && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                onClick={() => setFilters(prev => ({ ...prev, searchQuery: '' }))}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#fafaf9]/40 hover:text-[#fafaf9] p-1 rounded-lg hover:bg-white/[0.08] transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Action Controls */}
        <motion.div 
          className="flex items-center gap-2 sm:gap-3 shrink-0"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Mobile menu toggle */}
          <button
            id="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-[#fafaf9]/60 hover:text-[#fafaf9] hover:bg-white/[0.06] rounded-xl transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-[#ff4d00] text-white shadow-lg shadow-[#ff4d00]/20'
                  : 'text-[#fafaf9]/60 hover:text-[#fafaf9] hover:bg-white/[0.06]'
              }`}
            >
              <Grid className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-lg text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-[#ff4d00] text-white shadow-lg shadow-[#ff4d00]/20'
                  : 'text-[#fafaf9]/60 hover:text-[#fafaf9] hover:bg-white/[0.06]'
              }`}
            >
              <List className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Database Status */}
          {onOpenVercelDbModal && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenVercelDbModal}
              title="Database Settings"
              className="hidden lg:flex items-center gap-2 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#fafaf9]/70 text-xs font-medium rounded-xl transition-all"
            >
              <Database className="w-3.5 h-3.5 text-[#ff4d00]" />
              <span>Database</span>
            </motion.button>
          )}

          {/* Import/Export */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenImportExportModal}
            title="Import or Export Contacts"
            className="hidden md:flex items-center gap-2 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#fafaf9]/70 text-xs font-medium rounded-xl transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Import/Export</span>
          </motion.button>

          {/* Auth Section */}
          {isAuthenticated && user ? (
            <div className="hidden lg:flex items-center gap-3">
              <div className="flex items-center gap-2.5 px-3 py-2 bg-white/[0.04] border border-white/[0.08] rounded-xl">
                <div className="w-6 h-6 rounded-lg bg-[#ff4d00]/20 flex items-center justify-center text-[#ff4d00] text-[10px] font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-[#fafaf9]/80 max-w-[100px] truncate">{user.name}</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={logout}
                className="px-3 py-2 bg-white/[0.04] hover:bg-rose-500/10 border border-white/[0.08] hover:border-rose-500/30 text-[#fafaf9]/70 hover:text-rose-400 text-xs font-medium rounded-xl transition-all flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </motion.button>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openLogin}
              className="hidden lg:flex items-center gap-2 px-4 py-2.5 bg-[#ff4d00] hover:bg-[#ff6a2f] text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-[#ff4d00]/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </motion.button>
          )}

          {/* Add Contact — desktop */}
          {isAuthenticated && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onOpenAddModal}
              className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-[#ff4d00] hover:bg-[#ff6a2f] text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-[#ff4d00]/20"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Contact</span>
            </motion.button>
          )}
        </motion.div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden border-t border-white/[0.08] bg-[#0a0a0a]/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3">
              {/* Mobile Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fafaf9]/40" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="w-full pl-9 pr-8 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30"
                />
              </div>

              {/* Mobile View Toggle */}
              <div className="flex bg-white/[0.04] p-1 rounded-xl border border-white/[0.08]">
                <button onClick={() => setViewMode('grid')} className={`flex-1 py-2 rounded-lg text-xs font-medium ${viewMode === 'grid' ? 'bg-[#ff4d00] text-white' : 'text-[#fafaf9]/60'}`}>
                  Grid
                </button>
                <button onClick={() => setViewMode('table')} className={`flex-1 py-2 rounded-lg text-xs font-medium ${viewMode === 'table' ? 'bg-[#ff4d00] text-white' : 'text-[#fafaf9]/60'}`}>
                  Table
                </button>
              </div>

              {/* Mobile Actions */}
              <div className="flex gap-2">
                <button onClick={onOpenImportExportModal} className="flex-1 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs font-medium text-[#fafaf9]/70">
                  Import/Export
                </button>
                {onOpenVercelDbModal && (
                  <button onClick={onOpenVercelDbModal} className="flex-1 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs font-medium text-[#fafaf9]/70">
                    Database
                  </button>
                )}
              </div>

              {/* Auth Actions */}
              {isAuthenticated ? (
                <div className="flex gap-2 pt-2 border-t border-white/[0.08]">
                  <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-white/[0.04] rounded-xl">
                    <div className="w-6 h-6 rounded-lg bg-[#ff4d00]/20 flex items-center justify-center text-[#ff4d00] text-[10px] font-bold">
                      {user?.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-[#fafaf9]/80 truncate">{user?.name}</span>
                  </div>
                  <button onClick={logout} className="px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs font-medium text-rose-400">
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 pt-2 border-t border-white/[0.08]">
                  <button onClick={openLogin} className="flex-1 py-2.5 bg-white/[0.06] border border-white/[0.08] rounded-xl text-xs font-medium text-[#fafaf9]">
                    Sign In
                  </button>
                  <button onClick={openRegister} className="flex-1 py-2.5 bg-[#ff4d00] rounded-xl text-xs font-medium text-white">
                    Register
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authModalMode}
      />
    </header>
  );
};
