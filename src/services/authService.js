import api from './api';

// Primer paso del login. Si la cuenta tiene 2FA responde
// { twoFactorRequired: true, challengeToken, emailHint } y aún no hay sesión;
// si no, abre la sesión (cookie) y responde { message: "<ROL>" }.
export const login = async (userName, password) => {
  const response = await api.post('/auth/login', { userName, password });
  return response.data;
};

// Segundo paso: canjea el challengeToken y el código del correo por la sesión.
export const verifyTwoFactor = async (challengeToken, code) => {
  const response = await api.post('/auth/2fa/verify', { challengeToken, code });
  return response.data;
};

export const resendTwoFactor = async (challengeToken) => {
  const response = await api.post('/auth/2fa/resend', { challengeToken });
  return response.data;
};

export const getUserDetails = async () => {
  const response = await api.get('/auth/user/details');
  return response.data;
};

export const logout = async () => {
  const response = await api.post('/auth/logout');
  return response.data;
};

export default {
  login,
  verifyTwoFactor,
  resendTwoFactor,
  getUserDetails,
  logout,
};
