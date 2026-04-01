import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../utils/api.js';
import PageTransition from '../components/PageTransition.jsx';

const frequencyTimes = { 'Once daily': ['09:00'], 'Twice daily': ['09:00', '21:00'], 'Three times daily': ['08:00', '14:00', '20:00'] };

export default function Medicines({ medicines, refreshAll, initialFilter }) {
  const initial = {
    name: '', dosage: '', frequency: 'Once daily', customTimes: '', startDate: '', endDate: '', notes: '',
    reminderEnabled: true, stockEnabled: false, currentStock: 0, refillThreshold: 7, refillReminderEnabled: true,
  };
  const [form, setForm] = useState(initial);
  const [editingId, setEditingId] = useState('');
  const [stockOpen, setStockOpen] = useState(false);
  const [stockModal, setStockModal] = useState(null);
  const [addStock, setAddStock] = useState(0);

  const list = useMemo(() => (initialFilter === 'low-stock' ? medicines.filter((m) => Number(m.currentStock) <= Number(m.refillThreshold ?? 7)) : medicines), [initialFilter, medicines]);

  const save = async (e) => {
    e.preventDefault();
    const times = form.frequency === 'Custom' ? form.customTimes.split(',').map((x) => x.trim()).filter(Boolean) : frequencyTimes[form.frequency];
    const payload = {
      ...form,
      times,
      active: true,
      totalStock: form.stockEnabled ? Number(form.currentStock) : 0,
      currentStock: form.stockEnabled ? Number(form.currentStock) : 0,
      refillThreshold: Number(form.refillThreshold || 7),
    };
    delete payload.customTimes;
    delete payload.stockEnabled;
    if (editingId) await api(`/medicines/${editingId}`, 'PUT', payload); else await api('/medicines', 'POST', payload);
    setForm(initial);
    setEditingId('');
    refreshAll();
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        <form className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 grid md:grid-cols-2 gap-3" onSubmit={save}>
          <h3 className="md:col-span-2 font-semibold text-gray-900 dark:text-gray-100">Add / Edit Medicine</h3>
          <input className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" placeholder="Name" value={form.name} onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))} />
          <input className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" placeholder="Dosage" value={form.dosage} onChange={(e) => setForm((s) => ({ ...s, dosage: e.target.value }))} />
          <select className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" value={form.frequency} onChange={(e) => setForm((s) => ({ ...s, frequency: e.target.value }))}><option>Once daily</option><option>Twice daily</option><option>Three times daily</option><option>Custom</option></select>
          {form.frequency === 'Custom' && <input className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" placeholder="09:00,14:00" value={form.customTimes} onChange={(e) => setForm((s) => ({ ...s, customTimes: e.target.value }))} />}
          <input className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" type="date" value={form.startDate} onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))} />
          <input className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" type="date" value={form.endDate} onChange={(e) => setForm((s) => ({ ...s, endDate: e.target.value }))} />
          <input className="md:col-span-2 rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" placeholder="Notes" value={form.notes} onChange={(e) => setForm((s) => ({ ...s, notes: e.target.value }))} />
          <label className="text-gray-700 dark:text-gray-300"><input className="mr-2" type="checkbox" checked={stockOpen} onChange={(e) => setStockOpen(e.target.checked)} />Stock Tracking</label>
          {stockOpen && (
            <div className="md:col-span-2 grid md:grid-cols-3 gap-2">
              <label className="text-gray-700 dark:text-gray-300 text-sm"><input className="mr-2" type="checkbox" checked={form.stockEnabled} onChange={(e) => setForm((s) => ({ ...s, stockEnabled: e.target.checked }))} />Enable stock tracking</label>
              <input type="number" className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" placeholder="Current Stock" value={form.currentStock} onChange={(e) => setForm((s) => ({ ...s, currentStock: e.target.value }))} />
              <input type="number" className="rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" placeholder="Refill Threshold" value={form.refillThreshold} onChange={(e) => setForm((s) => ({ ...s, refillThreshold: e.target.value }))} />
              <label className="text-gray-700 dark:text-gray-300 text-sm"><input className="mr-2" type="checkbox" checked={form.refillReminderEnabled} onChange={(e) => setForm((s) => ({ ...s, refillReminderEnabled: e.target.checked }))} />Refill Reminder</label>
            </div>
          )}
          <motion.button whileTap={{ scale: 0.95 }} className="rounded bg-medical text-white px-4 py-2">{editingId ? 'Update' : 'Add'} medicine</motion.button>
        </form>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 space-y-2">
          {list.map((m) => {
            const low = Number(m.currentStock) <= Number(m.refillThreshold ?? 7);
            const out = Number(m.currentStock) === 0;
            const stockText = out ? '❌ Out of stock' : low ? `⚠ Only ${m.currentStock} left - refill soon` : `${m.currentStock} doses remaining`;
            const stockClass = out ? 'bg-red-100 text-red-700' : low ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';
            return (
              <div key={m.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex flex-col gap-2">
                <div className="flex justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{m.name} ({m.dosage})</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{m.frequency} • {m.times.join(', ')}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full h-fit ${stockClass}`}>{stockText}</span>
                </div>
                <div className="space-x-2">
                  <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-200" onClick={() => { setEditingId(m.id); setForm({ ...m, customTimes: m.frequency === 'Custom' ? m.times.join(',') : '', stockEnabled: true }); setStockOpen(true); }}>Edit</button>
                  <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-gray-200" onClick={() => { setStockModal(m); setAddStock(0); }}>Update Stock</button>
                  <button className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded text-red-600" onClick={async () => { await api(`/medicines/${m.id}`, 'DELETE'); refreshAll(); }}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {stockModal && (
        <div className="fixed inset-0 bg-black/40 grid place-items-center p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Add stock for {stockModal.name}</h3>
            <input type="number" className="w-full rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" value={addStock} onChange={(e) => setAddStock(Number(e.target.value))} />
            <div className="mt-3 flex gap-2">
              <button className="flex-1 border border-gray-300 dark:border-gray-600 rounded py-2 text-gray-800 dark:text-gray-200" onClick={() => setStockModal(null)}>Cancel</button>
              <button className="flex-1 bg-medical text-white rounded py-2" onClick={async () => { await api(`/medicines/${stockModal.id}`, 'PUT', { currentStock: Number(stockModal.currentStock || 0) + Number(addStock || 0) }); setStockModal(null); refreshAll(); }}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
