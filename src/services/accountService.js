import api from './api';

const ACCOUNT_URL = '/api/account';

// Operaciones del usuario autenticado sobre su propia cuenta.
export const accountService = {
  updateEmail: (email, currentPassword) =>
    api.put(`${ACCOUNT_URL}/email`, { email, currentPassword }).then((res) => res.data),
  requestEnableTwoFactor: () => api.post(`${ACCOUNT_URL}/2fa/enable`).then((res) => res.data),
  confirmEnableTwoFactor: (code) =>
    api.post(`${ACCOUNT_URL}/2fa/confirm`, { code }).then((res) => res.data),
  disableTwoFactor: (currentPassword) =>
    api.post(`${ACCOUNT_URL}/2fa/disable`, { currentPassword }).then((res) => res.data),
  changePassword: (currentPassword, newPassword) =>
    api.put(`${ACCOUNT_URL}/password`, { currentPassword, newPassword }).then((res) => res.data),
};

export default accountService;
