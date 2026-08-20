import React from 'react';
import {
  Users,
  CheckSquare,
  BarChart3,
  Building2,
  Bell,
  LayoutDashboard,
  TrendingUp
} from 'lucide-react';
import { ActiveView } from '../types';
import { useCrm } from '../contexts/CrmContext';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'motion/react';

interface ViewNavigationProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
}

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | null;
}

export const ViewNavigation: React.FC<ViewNavigationProps> = ({ activeView, setActiveView }) => {
  const { isAuthenticated } = useAuth();
  const { dueReminders } = useCrm();

  const navItems: NavItem[] = [
    { id: 'directory', label: 'Directory', icon: Users },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'deals', label: 'Deals', icon: BarChart3 },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'reminders', label: 'Reminders', icon: Bell, badge: dueReminders.length > 0 ? dueReminders.length : null },
    { id: 'reports', label: 'Reports', icon: TrendingUp },
  ];

  return (
    <nav id="view-navigation" className="w-full overflow-x-auto scrollbar-none">
      <div className="flex items-center gap-1.5 bg-[#141414] border border-white/[0.08] rounded-2xl p-1.5 min-w-max">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          const showBadge = item.badge && item.badge > 0 && item.id === 'reminders';

          return (
            <motion.button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveView(item.id)}
              whileTap={{ scale: 0.96 }}
              className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[#ff4d00] text-white shadow-lg shadow-[#ff4d00]/20'
                  : 'text-[#fafaf9]/60 hover:text-[#fafaf9] hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#fafaf9]/40'}`} />
              <span className="hidden sm:inline">{item.label}</span>
              {showBadge && (
                <motion.span
                  className="absolute -top-1 -right-2 w-5 h-5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center"
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {item.badge}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
