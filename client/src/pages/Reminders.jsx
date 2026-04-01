import { useMemo, useState } from 'react';
import PageTransition from '../components/PageTransition.jsx';

const badgeClass = {
  taken: 'bg-green-100 text-green-700',
  missed: 'bg-red-100 text-red-700',
  snoozed: 'bg-yellow-100 text-yellow-700',
};

export default function Reminders({ logs }) {
  const [filter, setFilter] = useState('all');
  const today = new Date().toISOString().slice(0, 10);
  const todayLogs = logs.filter((l) => l.scheduledTime?.slice(0, 10) === today);
  const summary = {
    taken: todayLogs.filter((l) => l.status === 'taken').length,
    missed: todayLogs.filter((l) => l.status === 'missed').length,
    snoozed: todayLogs.filter((l) => l.status === 'snoozed').length,
  };
  const list = useMemo(
    () => logs.filter((l) => (filter === 'all' ? true : l.status === filter)).sort((a, b) => new Date(b.actualTime) - new Date(a.actualTime)),
    [logs, filter],
  );

  return (
    <PageTransition>
      <div className="space-y-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-gray-900 dark:text-gray-100 font-medium">Today: {summary.taken} taken, {summary.missed} missed, {summary.snoozed} snoozed</p>
          <select className="mt-3 rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="taken">Taken</option>
            <option value="missed">Missed</option>
            <option value="snoozed">Snoozed</option>
          </select>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          {list.length ? list.map((l) => (
            <div key={l.id} className="border-b border-gray-200 dark:border-gray-700 py-2 flex justify-between gap-2">
              <p className="text-sm text-gray-700 dark:text-gray-300">{new Date(l.actualTime).toLocaleString()}</p>
              <span className={`text-xs px-2 py-1 rounded-full ${badgeClass[l.status] || 'bg-gray-100 text-gray-700'}`}>{l.status}</span>
            </div>
          )) : <p className="text-sm text-gray-600 dark:text-gray-400">No logs found.</p>}
        </div>
      </div>
    </PageTransition>
  );
}
