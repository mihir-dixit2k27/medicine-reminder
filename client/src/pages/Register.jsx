import { useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../utils/api.js';
import PageTransition from '../components/PageTransition.jsx';

export default function Register({ goLogin }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setDone('');
    setLoading(true);
    try {
      await api('/auth/register', 'POST', form);
      setDone('Registered successfully. You can login now.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-800 p-4">
        <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-lg border border-gray-200 dark:border-gray-700 space-y-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Create account</h1>
          <input className="w-full rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" placeholder="Username" value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} />
          <input className="w-full rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {done && <p className="text-green-600 text-sm">{done}</p>}
          <motion.button whileTap={{ scale: 0.95 }} className="w-full rounded-lg bg-medical py-2 text-white" disabled={loading}>
            {loading ? 'Creating...' : 'Register'}
          </motion.button>
          <button type="button" className="text-medical text-sm" onClick={goLogin}>Back to login</button>
        </form>
      </div>
    </PageTransition>
  );
}
