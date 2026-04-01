import { useState } from 'react';
import { motion } from 'framer-motion';
import PageTransition from '../components/PageTransition.jsx';
import { api } from '../utils/api.js';

const specialities = ['General Physician', 'Cardiologist', 'Endocrinologist', 'Dermatologist', 'Orthopedic', 'Neurologist', 'Other'];

export default function Appointments({ appointments, refreshAll }) {
  const [tab, setTab] = useState('Upcoming');
  const [form, setForm] = useState({ doctorName: '', specialty: 'General Physician', clinicName: '', date: '', time: '', notes: '', reminderEnabled: true });

  const now = Date.now();
  const list = appointments.filter((a) => {
    const isPast = a.status !== 'upcoming' || new Date(a.date).getTime() < now;
    return tab === 'Upcoming' ? !isPast : isPast;
  });

  return (
    <PageTransition>
      <div className="space-y-6">
        <form className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 grid md:grid-cols-2 gap-3" onSubmit={async (e) => { e.preventDefault(); await api('/appointments', 'POST', form); setForm({ doctorName: '', specialty: 'General Physician', clinicName: '', date: '', time: '', notes: '', reminderEnabled: true }); refreshAll(); }}>
          <input className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" placeholder="Doctor Name" value={form.doctorName} onChange={(e) => setForm((s) => ({ ...s, doctorName: e.target.value }))} />
          <select className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" value={form.specialty} onChange={(e) => setForm((s) => ({ ...s, specialty: e.target.value }))}>{specialities.map((s) => <option key={s}>{s}</option>)}</select>
          <input className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" placeholder="Clinic / Hospital Name" value={form.clinicName} onChange={(e) => setForm((s) => ({ ...s, clinicName: e.target.value }))} />
          <input type="date" className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" value={form.date} onChange={(e) => setForm((s) => ({ ...s, date: e.target.value }))} />
          <input type="time" className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" value={form.time} onChange={(e) => setForm((s) => ({ ...s, time: e.target.value }))} />
          <textarea className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white md:col-span-2" placeholder="Notes" value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
          <label className="text-gray-700 dark:text-gray-300"><input className="mr-2" type="checkbox" checked={form.reminderEnabled} onChange={(e) => setForm((s) => ({ ...s, reminderEnabled: e.target.checked }))} />Reminder enabled</label>
          <motion.button whileTap={{ scale: 0.95 }} className="rounded bg-medical text-white px-4 py-2">Add Appointment</motion.button>
        </form>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <div className="space-x-2 mb-3">
            <button className={`px-3 py-1 rounded ${tab === 'Upcoming' ? 'bg-medical text-white' : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'}`} onClick={() => setTab('Upcoming')}>Upcoming</button>
            <button className={`px-3 py-1 rounded ${tab === 'Past' ? 'bg-medical text-white' : 'border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200'}`} onClick={() => setTab('Past')}>Past</button>
          </div>
          {list.map((a) => {
            const isToday = new Date(a.date).toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10);
            const badge = a.status === 'completed' ? 'bg-green-100 text-green-700' : a.status === 'cancelled' ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-700';
            return (
              <div key={a.id} className={`border rounded-lg p-3 mb-2 ${isToday ? 'border-teal-500' : 'border-gray-200 dark:border-gray-700'}`}>
                <div className="flex justify-between flex-wrap gap-2">
                  <p className="text-gray-900 dark:text-gray-100">Dr. {a.doctorName} - {a.specialty}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${badge}`}>{a.status}</span>
                </div>
                {isToday && <span className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded-full">Today</span>}
                <p className="text-sm text-gray-600 dark:text-gray-400">{a.clinicName} • {new Date(a.date).toLocaleDateString()} {a.time}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{a.notes}</p>
                <div className="space-x-2 mt-2">
                  <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-200" onClick={async () => { await api(`/appointments/${a.id}`, 'PUT', { status: 'completed' }); refreshAll(); }}>Mark as Completed</button>
                  <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-200" onClick={async () => { await api(`/appointments/${a.id}`, 'PUT', { status: 'cancelled' }); refreshAll(); }}>Cancel</button>
                  <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-red-600" onClick={async () => { await api(`/appointments/${a.id}`, 'DELETE'); refreshAll(); }}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageTransition>
  );
}
