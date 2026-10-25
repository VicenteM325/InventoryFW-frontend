import { useCallback, useEffect, useState } from 'react';
import { notificationService } from '@/services/notificationService';
import { NOTIFICATIONS_CHANGED } from '@/utils/notificationEvents';

// Evita pedirlas dos veces seguidas: al volver a la pestaña se disparan "focus" y "visibilitychange".
const MIN_FOCUS_REFRESH_MS = 5000;

/**
 * Notificaciones sin leer del usuario. Se cargan al abrir el panel, se vuelven a pedir cuando
 * una acción las genera (ver notifyNotificationsChanged) y cuando el usuario regresa a la
 * pestaña, que es cuando pudo haber notificaciones nuevas de otras personas. Sin consultas periódicas.
 */
export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);

  const refresh = useCallback(async () => {
    try {
      setNotifications(await notificationService.getAll(false));
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    }
  }, []);

  useEffect(() => {
    refresh();
    let lastFocusRefresh = Date.now();
    const refreshOnReturn = () => {
      if (document.visibilityState === 'hidden') return;
      const now = Date.now();
      if (now - lastFocusRefresh < MIN_FOCUS_REFRESH_MS) return;
      lastFocusRefresh = now;
      refresh();
    };
    window.addEventListener(NOTIFICATIONS_CHANGED, refresh);
    window.addEventListener('focus', refreshOnReturn);
    document.addEventListener('visibilitychange', refreshOnReturn);
    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED, refresh);
      window.removeEventListener('focus', refreshOnReturn);
      document.removeEventListener('visibilitychange', refreshOnReturn);
    };
  }, [refresh]);

  const markAsRead = useCallback(async (id) => {
    setNotifications((current) => current.filter((n) => n.notificationId !== id));
    try {
      await notificationService.markAsRead(id);
    } catch (error) {
      console.error('Error marcando la notificación como leída:', error);
      refresh();
    }
  }, [refresh]);

  const markAllAsRead = useCallback(async () => {
    setNotifications([]);
    try {
      await notificationService.markAllAsRead();
    } catch (error) {
      console.error('Error marcando las notificaciones como leídas:', error);
      refresh();
    }
  }, [refresh]);

  return { notifications, markAsRead, markAllAsRead };
}
