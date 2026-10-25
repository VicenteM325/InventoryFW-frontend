import { useCallback, useEffect, useState } from 'react';
import { notificationService } from '@/services/notificationService';

const POLL_MS = 60_000;

/** Notificaciones sin leer del usuario, refrescadas cada minuto. */
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
    const timer = setInterval(refresh, POLL_MS);
    return () => clearInterval(timer);
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
