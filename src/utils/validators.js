// Validaciones de formularios. Cada función devuelve un mensaje de error en
// español, o '' si el valor es válido. Las reglas replican las del backend
// (UserCreateDto / PasswordRules) para dar el error antes de enviar; el
// backend sigue siendo quien las hace cumplir.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,50}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,72}$/;
const CODE_REGEX = /^\d{6}$/;

export function validateRequired(value, label) {
  return String(value ?? '').trim() ? '' : `${label} es obligatorio`;
}

export function validateUserName(value) {
  if (!String(value ?? '').trim()) return 'El usuario es obligatorio';
  return USERNAME_REGEX.test(value)
    ? ''
    : 'El usuario debe tener entre 3 y 50 caracteres: letras, números, punto, guion o guion bajo';
}

// optional=true admite vacío (correo opcional al crear usuarios).
export function validateEmail(value, { optional = false } = {}) {
  const email = String(value ?? '').trim();
  if (!email) return optional ? '' : 'El correo es obligatorio';
  if (email.length > 254) return 'El correo no puede superar 254 caracteres';
  return EMAIL_REGEX.test(email) ? '' : 'El correo electrónico no es válido';
}

export function validatePassword(value) {
  if (!value) return 'La contraseña es obligatoria';
  return PASSWORD_REGEX.test(value)
    ? ''
    : 'La contraseña debe tener entre 8 y 72 caracteres e incluir al menos una letra y un número';
}

export function validatePasswordConfirmation(password, confirmation) {
  if (!confirmation) return 'Confirme la contraseña';
  return password === confirmation ? '' : 'Las contraseñas no coinciden';
}

export function validateCode(value) {
  const code = String(value ?? '').trim();
  if (!code) return 'El código es obligatorio';
  return CODE_REGEX.test(code) ? '' : 'El código debe tener 6 dígitos';
}

// stock=null omite la comparación (cuando aún no se conoce el stock).
export function validateQuantity(value, stock = null) {
  const quantity = Number(value);
  if (!Number.isInteger(quantity) || quantity < 1) return 'La cantidad debe ser un entero de al menos 1';
  if (stock !== null && quantity > stock) return `Stock insuficiente (disponible: ${stock})`;
  return '';
}

// Devuelve solo los campos con error, p.ej. { userName: '...' }.
export function collectErrors(checks) {
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => message));
}
