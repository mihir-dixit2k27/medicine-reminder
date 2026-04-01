import { motion } from 'framer-motion';
import {
  Activity,
  Bell,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Moon,
  Pill,
  Sun,
  UserRound,
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext.jsx';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/medicines', icon: Pill, label: 'Medicines' },
  { to: '/reminders', icon: Bell, label: 'Reminders' },
  { to: '/appointments', icon: CalendarDays, label: 'Appointments' },
  { to: '/health-records', icon: ClipboardList, label: 'Health Records' },
  { to: '/profile', icon: UserRound, label: 'Profile' },
];

export default function Sidebar({ onLogout }) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  return (
    <aside className="md:w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-4">
      <h2 className="font-bold text-xl text-medical mb-4 flex items-center gap-2"><Activity size={18} /> Health Hub</h2>
      <nav className="space-y-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className="block">
            {({ isActive }) => (
              <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }} className="relative rounded-lg px-3 py-2 flex items-center gap-2 text-gray-600 dark:text-gray-300">
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-lg bg-teal-100 dark:bg-teal-900/40"
                    transition={{ duration: 0.25 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2"><Icon size={18} /> {label}</span>
              </motion.div>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="mt-6 space-y-3">
        <button
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-left text-gray-700 dark:text-gray-200"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <motion.span
            key={theme}
            initial={{ rotate: -45, scale: 0.8, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="inline-flex items-center gap-2"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </motion.span>
        </button>
        <button
          className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-gray-700 dark:text-gray-200"
          onClick={() => {
            localStorage.clear();
            onLogout();
            navigate('/login');
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
