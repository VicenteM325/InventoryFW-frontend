import { describe, expect, it } from 'vitest';
import { decimalOnly, digitsOnly } from './numberInput';

describe('digitsOnly', () => {
  it('quita signos y letras', () => {
    expect(digitsOnly('-5')).toBe('5');
    expect(digitsOnly('1a2')).toBe('12');
    expect(digitsOnly('')).toBe('');
    expect(digitsOnly(null)).toBe('');
  });
});

describe('decimalOnly', () => {
  it('admite un punto y limita decimales', () => {
    expect(decimalOnly('12.345')).toBe('12.34');
    expect(decimalOnly('1,5')).toBe('1.5');
    expect(decimalOnly('1.2.3')).toBe('1.23');
    expect(decimalOnly('-3')).toBe('3');
    expect(decimalOnly('')).toBe('');
  });
});
