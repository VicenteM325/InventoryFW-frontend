import { describe, expect, it } from 'vitest';
import { hasPlaceholderEmail, hasPlaceholderPhone, needsContactData } from './supplier';

describe('datos provisionales de proveedores', () => {
  it('detecta el correo provisional', () => {
    expect(hasPlaceholderEmail('sin-correo-3@proveedor.invalid')).toBe(true);
    expect(hasPlaceholderEmail(' VENTAS@TIGO.INVALID ')).toBe(true);
    expect(hasPlaceholderEmail('ventas@tigo.com')).toBe(false);
    expect(hasPlaceholderEmail(null)).toBe(false);
  });

  it('detecta el teléfono provisional', () => {
    expect(hasPlaceholderPhone('Pendiente')).toBe(true);
    expect(hasPlaceholderPhone(' pendiente ')).toBe(true);
    expect(hasPlaceholderPhone('5555-1234')).toBe(false);
  });

  it('un proveedor necesita completar datos si cualquiera es provisional', () => {
    expect(needsContactData({ email: 'a@b.com', phone: 'Pendiente' })).toBe(true);
    expect(needsContactData({ email: 'x@proveedor.invalid', phone: '55551234' })).toBe(true);
    expect(needsContactData({ email: 'a@b.com', phone: '55551234' })).toBe(false);
  });
});
