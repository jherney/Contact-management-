import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login, register } = useAuth();

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setEmail('');
    setPassword('');
    setName('');
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-xl flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-[#141414] border border-white/[0.08] rounded-[2rem] shadow-2xl overflow-hidden"
      >
        {/* Decorative accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#ff4d00] via-[#ff6a2f] to-[#ff4d00] opacity-80" />

        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#141414] p-8 border-b border-white/[0.08]">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 text-[#fafaf9]/40 hover:text-[#fafaf9] hover:bg-white/[0.06] rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-3xl)' }}>
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-xs text-[#fafaf9]/50 mt-2 tracking-wide">
            {mode === 'login' ? 'Sign in to access your network' : 'Start organizing your connections'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs flex items-center gap-3"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {mode === 'register' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1.5"
            >
              <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fafaf9]/30" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#0a0a0a] border border-white/[0.08] rounded-xl text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 focus:border-[#ff4d00]/30 transition-all"
                  required
                />
              </div>
            </motion.div>
          )}

          <div className="space-y-1.5">
            <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fafaf9]/30" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3.5 bg-[#0a0a0a] border border-white/[0.08] rounded-xl text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 focus:border-[#ff4d00]/30 transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs text-[#fafaf9]/60 font-semibold uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fafaf9]/30" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Min. 8 characters' : '••••••••'}
                className="w-full pl-11 pr-4 py-3.5 bg-[#0a0a0a] border border-white/[0.08] rounded-xl text-sm text-[#fafaf9] placeholder-[#fafaf9]/30 focus:outline-none focus:ring-2 focus:ring-[#ff4d00]/30 focus:border-[#ff4d00]/30 transition-all"
                required
                minLength={8}
              />
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.01 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            className="w-full py-4 bg-[#ff4d00] hover:bg-[#ff6a2f] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-[#ff4d00]/20 text-sm tracking-wide"
          >
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </motion.button>

          <div className="text-center pt-1">
            <button
              type="button"
              onClick={switchMode}
              className="text-xs text-[#ff4d00] hover:text-[#ff6a2f] font-semibold transition-colors"
            >
              {mode === 'login' ? "Don't have an account? Create one" : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
