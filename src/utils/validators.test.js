import { describe, expect, it } from 'vitest';
import {
  collectErrors,
  validateCode,
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  validatePhone,
  validateQuantity,
  validateRequired,
  validateUserName,
} from './validators';

describe('validateRequired', () => {
  it('rechaza vacío y solo espacios', () => {
    expect(validateRequired('', 'El nombre')).toBe('El nombre es obligatorio');
    expect(validateRequired('   ', 'El nombre')).toBe('El nombre es obligatorio');
    expect(validateRequired(null, 'El nombre')).toBe('El nombre es obligatorio');
  });
  it('acepta texto', () => {
    expect(validateRequired('Ana', 'El nombre')).toBe('');
  });
});

describe('validateUserName', () => {
  it.each(['ana', 'ana.perez', 'ana_perez-1', 'a'.repeat(50)])('acepta %s', (value) => {
    expect(validateUserName(value)).toBe('');
  });
  it.each(['', 'ab', 'ana perez', 'ana@perez', 'a'.repeat(51), 'año'])('rechaza "%s"', (value) => {
    expect(validateUserName(value)).not.toBe('');
  });
});

describe('validateEmail', () => {
  it('acepta correos válidos', () => {
    expect(validateEmail('ana@correo.com')).toBe('');
    expect(validateEmail(' ana@correo.com ')).toBe('');
  });
  it('rechaza formatos inválidos', () => {
    ['ana', 'ana@', '@correo.com', 'ana@correo', 'a na@correo.com'].forEach((value) => {
      expect(validateEmail(value)).toBe('El correo electrónico no es válido');
    });
  });
  it('exige valor salvo que sea opcional', () => {
    expect(validateEmail('')).toBe('El correo es obligatorio');
    expect(validateEmail('', { optional: true })).toBe('');
  });
  it('rechaza más de 254 caracteres', () => {
    expect(validateEmail(`${'a'.repeat(250)}@x.com`)).toBe('El correo no puede superar 254 caracteres');
  });
});

describe('validatePassword', () => {
  it('acepta 8-72 caracteres con letra y número', () => {
    expect(validatePassword('Clave2026')).toBe('');
    expect(validatePassword('a1'.repeat(36))).toBe('');
  });
  it.each(['', 'corta1', 'soloLetrasAqui', '12345678', 'a1'.repeat(37)])('rechaza "%s"', (value) => {
    expect(validatePassword(value)).not.toBe('');
  });
});

describe('validatePasswordConfirmation', () => {
  it('detecta diferencias y vacío', () => {
    expect(validatePasswordConfirmation('Clave2026', 'Clave2027')).toBe('Las contraseñas no coinciden');
    expect(validatePasswordConfirmation('Clave2026', '')).toBe('Confirme la contraseña');
  });
  it('acepta coincidencia', () => {
    expect(validatePasswordConfirmation('Clave2026', 'Clave2026')).toBe('');
  });
});

describe('validateCode', () => {
  it('acepta exactamente 6 dígitos', () => {
    expect(validateCode('012345')).toBe('');
    expect(validateCode(' 012345 ')).toBe('');
  });
  it.each(['', '12345', '1234567', '12345a', 'abcdef'])('rechaza "%s"', (value) => {
    expect(validateCode(value)).not.toBe('');
  });
});

describe('validateQuantity', () => {
  it('exige entero de al menos 1', () => {
    expect(validateQuantity(0)).not.toBe('');
    expect(validateQuantity(-3)).not.toBe('');
    expect(validateQuantity(1.5)).not.toBe('');
    expect(validateQuantity('abc')).not.toBe('');
    expect(validateQuantity('2')).toBe('');
  });
  it('compara contra el stock disponible', () => {
    expect(validateQuantity(5, 5)).toBe('');
    expect(validateQuantity(6, 5)).toBe('Stock insuficiente (disponible: 5)');
  });
});

describe('collectErrors', () => {
  it('devuelve solo los campos con error', () => {
    expect(collectErrors({ a: '', b: 'mal', c: '', d: 'peor' })).toEqual({ b: 'mal', d: 'peor' });
  });
});

describe('validatePhone', () => {
  it('acepta números con separadores', () => {
    expect(validatePhone('5555-1234')).toBe('');
    expect(validatePhone('+502 5555 1234')).toBe('');
    expect(validatePhone('(502) 55551234')).toBe('');
  });

  it('rechaza vacío, corto o con letras', () => {
    expect(validatePhone('')).toBe('El teléfono es obligatorio');
    expect(validatePhone('   ')).toBe('El teléfono es obligatorio');
    expect(validatePhone('1234')).not.toBe('');
    expect(validatePhone('5555-abcd')).not.toBe('');
  });
});
