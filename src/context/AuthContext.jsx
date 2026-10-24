import React, { createContext, useState, useEffect, useCallback } from 'react';
import { getUserDetails, logout as logoutService } from '@/services/authService';
import { UNAUTHORIZED_EVENT } from '@/services/api';

export const AuthContext = createContext();

// Claves que versiones anteriores guardaban en localStorage (incluido un token
// copiado fuera de la cookie httpOnly). Ya no se usan; se limpian por seguridad.
const LEGACY_STORAGE_KEYS = ['token', 'user', 'roles'];

// Unifica la forma del usuario sea cual sea el origen (login, verificación de
// sesión o refresco tras cambiar el perfil).
function normalizeUser(data) {
  const roleName = data.role?.name || data.role || '';
  return {
    user: {
      userId: data.userId,
      name: data.name,
      userName: data.userName,
      email: data.email || '',
      twoFactorEnabled: Boolean(data.twoFactorEnabled),
    },
    roles: roleName ? [roleName] : [],
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  const clearSession = useCallback(() => {
    setUser(null);
    setRoles([]);
  }, []);

  // Consulta al backend quién es el usuario de la cookie. Un 401 significa
  // "sin sesión" (normal); cualquier otro fallo (red, 500) se informa en
  // authError en vez de tratarse en silencio como si no hubiera sesión.
  const verifySession = useCallback(async () => {
    try {
      const data = await getUserDetails();
      const normalized = normalizeUser(data);
      setUser(normalized.user);
      setRoles(normalized.roles);
      setAuthError('');
    } catch (error) {
      clearSession();
      if (error.response?.status !== 401) {
        setAuthError('No se pudo verificar la sesión. Revise su conexión e intente de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  }, [clearSession]);

  useEffect(() => {
    try {
      LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      // Almacenamiento no disponible (modo privado): no afecta a la sesión.
    }
    verifySession();
  }, [verifySession]);

  // Una respuesta 401 en cualquier petición autenticada cierra la sesión local;
  // PrivateRoute redirige a login sin recargar la página.
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, clearSession);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, clearSession);
  }, [clearSession]);

  // Recibe el detalle completo de /auth/user/details tras autenticarse.
  const login = (data) => {
    const normalized = normalizeUser(data);
    setUser(normalized.user);
    setRoles(normalized.roles);
    setAuthError('');
  };

  const logout = async () => {
    try {
      await logoutService();
    } catch (error) {
      // La sesión pudo haber vencido ya en el backend; igual se limpia localmente.
    }
    clearSession();
  };

  return (
    <AuthContext.Provider
      value={{ user, roles, loading, authError, login, logout, refreshUser: verifySession }}
    >
      {children}
    </AuthContext.Provider>
  );
}
