import api from './api';

const API_URL = '/api/reports';

export const reportService = {
  // Archivos descargables (PDF o Excel).
  getSalesReport: (from, to, format) =>
    api
      .get(`${API_URL}/sales`, { params: { from, to, format }, responseType: 'blob' })
      .then((res) => res.data),
  getInventoryReport: (format) =>
    api
      .get(`${API_URL}/inventory`, { params: { format }, responseType: 'blob' })
      .then((res) => res.data),

  // Datos para la vista en pantalla.
  getSalesSummary: (from, to) =>
    api.get(`${API_URL}/sales/summary`, { params: { from, to } }).then((res) => res.data),
  getInventorySummary: () => api.get(`${API_URL}/inventory/summary`).then((res) => res.data),
};
