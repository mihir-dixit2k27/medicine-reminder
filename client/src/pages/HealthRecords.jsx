import { useState } from 'react';
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { motion } from 'framer-motion';
import { FileDown, Loader2 } from 'lucide-react';
import PageTransition from '../components/PageTransition.jsx';
import { api } from '../utils/api.js';
import { useTheme } from '../context/ThemeContext.jsx';
import { generateHealthReport } from '../utils/generateReport.js';

const UNIT_MAP = { 'Blood Pressure': 'mmHg', 'Blood Sugar': 'mg/dL', Weight: 'kg', 'Heart Rate': 'bpm', Other: '' };

export default function HealthRecords({ records, refreshAll, user, medicines, logs, appointments }) {
  const { theme } = useTheme();
  const [form, setForm] = useState({ type: 'Blood Pressure', value: '', date: '', notes: '' });
  const [filterType, setFilterType] = useState('All');
  const [exporting, setExporting] = useState(false);
  const unit = UNIT_MAP[form.type];
  const filtered = records.filter((r) => filterType === 'All' || r.type === filterType);
  const trendData = filtered.map((r) => ({ date: new Date(r.date).toLocaleDateString(), value: Number(typeof r.value === 'object' ? r.value.systolic : r.value) || 0 }));

  return (
    <PageTransition>
      <div className="space-y-6">
        <form className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 grid md:grid-cols-2 gap-3" onSubmit={async (e) => { e.preventDefault(); const value = form.type === 'Blood Pressure' ? (() => { const [s, d] = String(form.value).split('/'); return { systolic: s || '', diastolic: d || '' }; })() : form.value; await api('/health-records', 'POST', { ...form, value, unit }); setForm({ type: 'Blood Pressure', value: '', date: '', notes: '' }); refreshAll(); }}>
          <div className="md:col-span-2 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Health Records</h3>
            <button
              type="button"
              className="text-sm text-medical inline-flex items-center gap-1"
              onClick={async () => {
                setExporting(true);
                try {
                  await generateHealthReport(user, medicines, logs, records, appointments);
                } finally {
                  setExporting(false);
                }
              }}
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
              Export Report
            </button>
          </div>
          <select className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value }))}>{Object.keys(UNIT_MAP).map((x) => <option key={x}>{x}</option>)}</select>
          <input className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" placeholder={form.type === 'Blood Pressure' ? '120/80' : 'Value'} value={form.value} onChange={(e) => setForm((s) => ({ ...s, value: e.target.value }))} />
          <input className="rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" value={unit} readOnly />
          <input type="datetime-local" className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" value={form.date} onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))} />
          <input className="md:col-span-2 rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" placeholder="Notes" value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
          <motion.button whileTap={{ scale: 0.95 }} className="rounded bg-medical text-white px-4 py-2">Save Record</motion.button>
        </form>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <select className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" value={filterType} onChange={(e) => setFilterType(e.target.value)}><option>All</option>{Object.keys(UNIT_MAP).map((x) => <option key={x}>{x}</option>)}</select>
          <div className="mt-3">{filtered.map((r) => <p className="text-sm border-b border-gray-200 dark:border-gray-700 py-2 text-gray-700 dark:text-gray-300" key={r.id}>{r.type} - {typeof r.value === 'object' ? `${r.value.systolic}/${r.value.diastolic}` : r.value} {r.unit}</p>)}</div>
        </div>
        <div id="health-trends-chart" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 h-72">
          <ResponsiveContainer width="100%" height="95%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#e5e7eb'} />
              <XAxis dataKey="date" tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
              <YAxis tick={{ fill: theme === 'dark' ? '#9ca3af' : '#6b7280' }} />
              <Tooltip contentStyle={{ background: theme === 'dark' ? '#1f2937' : '#fff', border: '1px solid #374151' }} />
              <Line dataKey="value" stroke="#0D9488" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </PageTransition>
  );
}
