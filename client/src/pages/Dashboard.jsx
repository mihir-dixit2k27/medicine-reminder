import { motion } from 'framer-motion';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '../context/ThemeContext.jsx';
import PageTransition from '../components/PageTransition.jsx';

export default function Dashboard({ medicines, logs, healthRecords, appointments, onTakeNow, onOpenLowStock }) {
  const { theme } = useTheme();
  const today = new Date().toISOString().slice(0, 10);
  const todayMeds = medicines.filter((m) => m.active && today >= m.startDate && today <= m.endDate);
  const lowStock = medicines.filter((m) => Number(m.currentStock) <= Number(m.refillThreshold ?? 7));
  const upcomingAppointments = appointments
    .filter((a) => a.status === 'upcoming' && new Date(a.date).getTime() >= Date.now())
    .slice(0, 3);

  const adherence = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - idx));
    const day = d.toISOString().slice(0, 10);
    const dayLogs = logs.filter((l) => l.scheduledTime?.slice(0, 10) === day);
    const taken = dayLogs.filter((l) => l.status === 'taken').length;
    const total = dayLogs.length || 1;
    return { day: day.slice(5), rate: Math.round((taken / total) * 100) };
  });

  const cards = [
    ['Total Medicines', medicines.length],
    ["Today's Doses", todayMeds.length],
    ['Upcoming Reminders', todayMeds.filter((m) => m.reminderEnabled).length],
    ['Health Records', healthRecords.length],
  ];

  return (
    <PageTransition>
      <div className="space-y-6">
        <motion.div initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }} className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {cards.map(([title, value]) => (
            <motion.div key={title} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
            </motion.div>
          ))}
          <motion.button
            variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
            className={`rounded-xl shadow-sm p-4 border text-left ${lowStock.length ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20' : 'border-green-300 bg-green-50 dark:bg-green-900/20'}`}
            onClick={onOpenLowStock}
          >
            <p className="text-sm text-gray-600 dark:text-gray-400">Refill Alerts</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{lowStock.length ? `${lowStock.length} low-stock` : 'All stocked up ✓'}</p>
          </motion.button>
        </motion.div>

        <section className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Today's schedule</h3>
          <div className="space-y-2">
            {todayMeds.map((m) => (
              <div key={m.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex justify-between">
                <p className="text-gray-900 dark:text-gray-100">{m.name} ({m.dosage})</p>
                <motion.button whileTap={{ scale: 0.95 }} className="rounded bg-medical text-white px-3 py-1" onClick={() => onTakeNow(m.id)}>Mark as Taken</motion.button>
              </div>
            ))}
            {!todayMeds.length && <p className="text-sm text-gray-600 dark:text-gray-400">No medicines for today.</p>}
          </div>
        </section>

        <section id="weekly-adherence-chart" className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm h-72 border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Weekly adherence rate</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={adherence}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="day" tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
              <YAxis tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
              <Tooltip contentStyle={{ background: theme === 'dark' ? '#1f2937' : '#fff', border: '1px solid #374151' }} />
              <Line type="monotone" dataKey="rate" stroke="#0D9488" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Upcoming Appointments</h3>
          {upcomingAppointments.length ? upcomingAppointments.map((a) => (
            <div key={a.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-2">
              <p className="text-gray-900 dark:text-gray-100">Dr. {a.doctorName} - {a.specialty}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(a.date).toLocaleDateString()} {a.time} • {a.clinicName}</p>
            </div>
          )) : <p className="text-sm text-gray-600 dark:text-gray-400">No upcoming appointments.</p>}
        </section>
      </div>
    </PageTransition>
  );
}
