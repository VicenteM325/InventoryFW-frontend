import api from './api';
import { notifyNotificationsChanged } from '@/utils/notificationEvents';

const API_URL = '/api/sales';

export const saleService = {
  create: (data) => {
    // Una venta puede dejar un producto con stock bajo o agotado: la campana se actualiza al instante.
    return api.post(API_URL, data).then(res => {
      notifyNotificationsChanged();
      return res.data;
    });
  },
  getRecent: () => api.get(`${API_URL}/recent`).then(res => res.data),
};