import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileDown, Loader2 } from 'lucide-react';
import PageTransition from '../components/PageTransition.jsx';
import { api } from '../utils/api.js';
import { generateHealthReport } from '../utils/generateReport.js';

export default function Profile({ profile, logs, refreshAll, medicines, healthRecords, appointments }) {
  const [form, setForm] = useState(profile || {});
  const [reportLoading, setReportLoading] = useState(false);
  useEffect(() => setForm(profile || {}), [profile]);
  const taken = logs.filter((l) => l.status === 'taken').length;
  const missed = logs.filter((l) => l.status === 'missed').length;
  const pct = Math.round((taken / Math.max(taken + missed, 1)) * 100);

  return (
    <PageTransition>
      <div className="space-y-6">
        <form className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 grid md:grid-cols-2 gap-3" onSubmit={async (e) => { e.preventDefault(); await api('/profile', 'PUT', form); refreshAll(); }}>
          {['name', 'age', 'gender', 'bloodGroup', 'emergencyContact'].map((field) => (
            <input key={field} className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" placeholder={field} value={form[field] || ''} onChange={(e) => setForm((s) => ({ ...s, [field]: e.target.value }))} />
          ))}
          <motion.button whileTap={{ scale: 0.95 }} className="rounded bg-medical text-white px-4 py-2">Save Profile</motion.button>
        </form>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-2 rounded-lg bg-medical text-white px-4 py-2"
          onClick={async () => {
            setReportLoading(true);
            try {
              await generateHealthReport(form, medicines, logs, healthRecords, appointments);
            } finally {
              setReportLoading(false);
            }
          }}
        >
          {reportLoading ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
          {reportLoading ? 'Generating report...' : 'Download Health Report'}
        </motion.button>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-gray-900 dark:text-gray-100">Taken: {taken} | Missed: {missed} | Success: {pct}%</p>
        </div>
      </div>
    </PageTransition>
  );
}
