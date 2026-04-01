const API_BASE = '/api';

export async function api(path, method = 'GET', body) {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || 'Request failed');
  }
  if (response.status === 204) return null;
  return response.json();
}
