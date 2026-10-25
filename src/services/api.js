import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Evento que el AuthContext escucha para cerrar la sesión local cuando el
// backend responde 401 a una petición autenticada (sesión vencida).
export const UNAUTHORIZED_EVENT = 'auth:unauthorized';

// La sesión vive en una cookie httpOnly que el navegador envía sola
// (withCredentials); el frontend nunca maneja ni guarda el token.
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// En estos endpoints un 401 es parte del flujo normal (credenciales o código
// incorrectos, comprobar si hay sesión al cargar) y no significa "sesión vencida".
const AUTH_FLOW_URLS = ['/auth/login', '/auth/2fa/', '/auth/user/details', '/auth/logout'];

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthFlow = AUTH_FLOW_URLS.some((flowUrl) => url.includes(flowUrl));
    if (error.response?.status === 401 && !isAuthFlow) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  }
);

export default api;
