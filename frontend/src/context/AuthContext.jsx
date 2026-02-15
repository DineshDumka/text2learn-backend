import { createContext, useState, useEffect, useCallback } from "react";
import * as authApi from "../api/auth.api";
import { setAccessToken, clearAccessToken } from "../api/axios";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Try silent refresh on mount (page reload)
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data } = await authApi.refresh();
        setAccessToken(data.data.accessToken);
        setUser(data.data.user);
      } catch {
        // No refresh token — user is logged out
        clearAccessToken();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login(email, password);
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data;
  }, []);

  const register = useCallback(async (name, email, password) => {
    const { data } = await authApi.register(name, email, password);
    setAccessToken(data.data.accessToken);
    setUser(data.data.user);
    return data.data;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Swallow — clear local state regardless
    }
    clearAccessToken();
    setUser(null);
  }, []);

  const value = { user, loading, login, register, logout, isAuthenticated: !!user };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
