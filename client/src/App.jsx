import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from './utils/api.js';
import Sidebar from './components/Sidebar.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Medicines from './pages/Medicines.jsx';
import Reminders from './pages/Reminders.jsx';
import HealthRecords from './pages/HealthRecords.jsx';
import Profile from './pages/Profile.jsx';
import Appointments from './pages/Appointments.jsx';

function AppCore() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [authMode, setAuthMode] = useState('login');
  const [medicines, setMedicines] = useState([]);
  const [logs, setLogs] = useState([]);
  const [healthRecords, setHealthRecords] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState(null);
  const [scheduled, setScheduled] = useState([]);

  const refreshAll = async () => {
    if (!localStorage.getItem('token')) return;
    const [m, l, h, p, a] = await Promise.all([api('/medicines'), api('/logs'), api('/health-records'), api('/profile'), api('/appointments')]);
    setMedicines(m);
    setLogs(l);
    setHealthRecords(h);
    setProfile(p);
    setAppointments(a);
  };

  const logDose = async (medicineId, status, scheduledTime = new Date().toISOString()) => {
    await api('/logs', 'POST', { medicineId, status, scheduledTime, actualTime: new Date().toISOString() });
    await refreshAll();
  };

  const markTaken = async (medicineId) => {
    await logDose(medicineId, 'taken');
    setToast(null);
  };

  useEffect(() => {
    const init = async () => {
      if (token) await refreshAll();
      setLoading(false);
    };
    init();
  }, [token]);

  const lowStock = useMemo(
    () => medicines.filter((m) => Number(m.currentStock) <= Number(m.refillThreshold ?? 7) && m.refillReminderEnabled),
    [medicines],
  );

  useEffect(() => {
    if (!token) return;
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [token]);

  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const upcoming = medicines.flatMap((m) => {
      if (!m.active || !m.reminderEnabled || today < m.startDate || today > m.endDate) return [];
      return m.times.map((time) => ({ medicineId: m.id, name: m.name, dosage: m.dosage, dueKey: `${today}T${time}`, dueTime: new Date(`${today}T${time}:00`) }));
    });
    setScheduled(upcoming);
  }, [medicines]);

  useEffect(() => {
    if (!token) return;
    const id = setInterval(async () => {
      const now = new Date();
      for (const item of scheduled) {
        if (Math.abs(now - item.dueTime) < 60000) {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Medicine reminder: ${item.name}`, { body: `Dosage: ${item.dosage}` });
          }
          setToast(item);
        }
      }
      for (const appt of appointments) {
        if (!appt.reminderEnabled || appt.status !== 'upcoming') continue;
        const apptTime = new Date(`${appt.date}T${appt.time}:00`);
        const diff = apptTime.getTime() - now.getTime();
        if (diff > 0 && diff <= 3600000 && Notification.permission === 'granted') {
          new Notification(`Appointment reminder: Dr. ${appt.doctorName}`, {
            body: `at ${appt.time} - ${appt.clinicName}`,
          });
        }
      }
    }, 60000);
    return () => clearInterval(id);
  }, [appointments, scheduled, token]);

  useEffect(() => {
    if (!token || Notification.permission !== 'granted') return;
    const key = `low-stock-notified-${new Date().toISOString().slice(0, 10)}`;
    if (localStorage.getItem(key)) return;
    if (lowStock.length) {
      new Notification(`Refill reminder: ${lowStock[0].name} is running low`, { body: `${lowStock[0].currentStock} doses remaining` });
      localStorage.setItem(key, '1');
    }
  }, [lowStock, token]);

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="animate-spin text-medical" /></div>;
  if (!token) {
    return authMode === 'login' ? (
      <Login onLogin={() => setToken(localStorage.getItem('token') || '')} goRegister={() => setAuthMode('register')} />
    ) : (
      <Register goLogin={() => setAuthMode('login')} />
    );
  }

  return (
    <>
      <div className="min-h-screen md:flex bg-gray-50 dark:bg-gray-800">
        <Sidebar onLogout={() => setToken('')} />
        <main className="flex-1 p-4 md:p-6">
          <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
              <Route path="/dashboard" element={<Dashboard medicines={medicines} logs={logs} healthRecords={healthRecords} appointments={appointments} onTakeNow={markTaken} onOpenLowStock={() => navigate('/medicines?filter=low-stock')} />} />
              <Route path="/medicines" element={<Medicines medicines={medicines} refreshAll={refreshAll} initialFilter={new URLSearchParams(location.search).get('filter')} />} />
              <Route path="/reminders" element={<Reminders logs={logs} />} />
              <Route path="/appointments" element={<Appointments appointments={appointments} refreshAll={refreshAll} />} />
              <Route path="/health-records" element={<HealthRecords records={healthRecords} refreshAll={refreshAll} user={profile} medicines={medicines} logs={logs} appointments={appointments} />} />
              <Route path="/profile" element={<Profile profile={profile} logs={logs} refreshAll={refreshAll} medicines={medicines} healthRecords={healthRecords} appointments={appointments} />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
      {toast && (
        <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="fixed right-4 bottom-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 w-72 border border-gray-200 dark:border-gray-700">
          <p className="font-semibold mb-1">Time for {toast.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{toast.dosage}</p>
          <div className="flex gap-2">
            <motion.button whileTap={{ scale: 0.95 }} className="flex-1 bg-medical text-white rounded px-3 py-2" onClick={() => markTaken(toast.medicineId)}>Take Now</motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-gray-800 dark:text-gray-200" onClick={async () => { await logDose(toast.medicineId, 'snoozed'); setScheduled((s) => s.map((x) => (x.medicineId === toast.medicineId ? { ...x, dueTime: new Date(Date.now() + 10 * 60000) } : x))); setToast(null); }}>Snooze 10m</motion.button>
          </div>
        </motion.div>
      )}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppCore />
    </BrowserRouter>
  );
}
