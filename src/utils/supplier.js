// La migración que hizo obligatorios el correo y el teléfono dejó en los proveedores antiguos valores
// provisionales: un correo "...@proveedor.invalid" (nunca entrega) y el teléfono "Pendiente".
// Hay que completarlos antes de poder pedirles producto.

export function hasPlaceholderEmail(email) {
  return String(email ?? '').trim().toLowerCase().endsWith('.invalid');
}

export function hasPlaceholderPhone(phone) {
  return String(phone ?? '').trim().toLowerCase() === 'pendiente';
}

export function needsContactData(supplier) {
  return hasPlaceholderEmail(supplier?.email) || hasPlaceholderPhone(supplier?.phone);
}
