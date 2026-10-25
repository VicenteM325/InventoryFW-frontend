// Las notificaciones se crean en el servidor como consecuencia de acciones (vender, agotar un
// producto, activarlo o desactivarlo). En vez de consultar cada cierto tiempo, quien ejecuta la
// acción avisa y la campana vuelve a consultar en ese momento.

export const NOTIFICATIONS_CHANGED = 'inventoryfw:notifications-changed';

export function notifyNotificationsChanged() {
  window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED));
}
