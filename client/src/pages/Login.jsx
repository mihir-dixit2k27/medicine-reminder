import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '../utils/api.js';
import PageTransition from '../components/PageTransition.jsx';

export default function Login({ onLogin, goRegister }) {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await api('/auth/login', 'POST', form);
      localStorage.setItem('token', data.token);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const tryDemo = async () => {
    setDemoLoading(true);
    setError('');
    try {
      const data = await api('/auth/demo', 'POST');
      localStorage.setItem('token', data.token);
      onLogin();
    } catch (err) {
      setError(err.message);
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen grid place-items-center bg-gray-50 dark:bg-gray-800 p-4">
        <form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-lg border border-gray-200 dark:border-gray-700 space-y-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Welcome back</h1>
          <input className="w-full rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" placeholder="Username" value={form.username} onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))} />
          <input className="w-full rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 border p-2 text-gray-900 dark:text-white" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))} />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <motion.button whileTap={{ scale: 0.95 }} className="w-full rounded-lg bg-medical py-2 text-white" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </motion.button>
          <button type="button" className="text-medical text-sm" onClick={goRegister}>Create account</button>
          <button type="button" onClick={tryDemo} disabled={demoLoading} className="w-full rounded-lg border-2 border-dashed border-teal-500 py-2 text-teal-600 dark:text-teal-300">
            {demoLoading ? <span className="inline-flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Loading demo...</span> : 'Try Demo Account'}
          </button>
          <p className="text-xs text-gray-600 dark:text-gray-400">Explore with pre-filled data — no sign-up needed</p>
        </form>
      </div>
    </PageTransition>
  );
}
