import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { clearToken, getToken, setToken, setUnauthorizedHandler } from '../services/api.js';
import { api } from '../services/endpoints.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    // Session expirée détectée par n'importe quel appel API → retour au login
    setUnauthorizedHandler(() => { clearToken(); setUser(null); });
    if (!getToken()) return;
    api.profile()
      .then((r) => setUser(r.user))
      .catch(() => { clearToken(); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((token, nextUser) => {
    setToken(token);
    setUser(nextUser);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
