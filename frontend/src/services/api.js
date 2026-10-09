// Client HTTP centralisé : AUCUN composant n'appelle fetch directement.
const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
const TOKEN_KEY = 'etic_token';

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = (token) => {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* stockage indisponible */ }
};
export const clearToken = () => {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* stockage indisponible */ }
};

// Appelé quand le backend répond 401 sur une route protégée (session expirée).
let onUnauthorized = () => {};
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export async function request(path, { method = 'GET', body, params } = {}) {
  let query = '';
  if (params) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') sp.set(k, v);
    });
    const s = sp.toString();
    if (s) query = `?${s}`;
  }

  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${BASE_URL}${path}${query}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', "Impossible de joindre le serveur. Vérifiez que le backend est lancé et que VITE_API_URL est correct.");
  }

  if (res.status === 204) return null;

  let data = null;
  try { data = await res.json(); } catch { /* corps vide ou non JSON */ }

  if (!res.ok) {
    const err = data?.error;
    if (res.status === 401 && token && !path.startsWith('/auth/')) onUnauthorized();
    throw new ApiError(res.status, err?.code || 'HTTP_ERROR', err?.message || `Erreur ${res.status}`, err?.details);
  }
  return data;
}
