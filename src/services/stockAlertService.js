import api from './api';

const API_URL = '/api/stock-alerts';

export const stockAlertService = {
  getPending: () => api.get(`${API_URL}/pending`).then(res => res.data),
  // Pedido de reposición al proveedor del producto de la alerta (solo administradores).
  previewSupplierOrder: (id, quantity) =>
    api.post(`${API_URL}/${id}/supplier-order/preview`, { quantity }).then(res => res.data),
  sendSupplierOrder: (id, quantity) =>
    api.post(`${API_URL}/${id}/supplier-order`, { quantity }).then(res => res.data),
  attend: (id) => api.patch(`${API_URL}/${id}/attend`).then(res => res.data),
};