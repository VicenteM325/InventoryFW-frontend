import { describe, expect, it } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatInt,
  formatMoney,
  formatPct,
  formatShortDate,
  formatStatus,
} from './format';

describe('formatMoney', () => {
  it('usa quetzales con miles y dos decimales', () => {
    expect(formatMoney(1234.5)).toBe('Q 1,234.50');
    expect(formatMoney(0)).toBe('Q 0.00');
    expect(formatMoney('18450')).toBe('Q 18,450.00');
  });
  it('tolera valores vacíos', () => {
    expect(formatMoney(null)).toBe('Q 0.00');
    expect(formatMoney(undefined)).toBe('Q 0.00');
  });
});

describe('formatInt', () => {
  it('agrupa miles', () => {
    expect(formatInt(1234567)).toBe('1,234,567');
    expect(formatInt(null)).toBe('0');
  });
});

describe('formatPct', () => {
  it('pone signo explícito a los positivos', () => {
    expect(formatPct(12.5)).toBe('+12.5%');
    expect(formatPct(-3.1)).toBe('-3.1%');
    expect(formatPct(0)).toBe('0%');
  });
  it('null significa sin base de comparación', () => {
    expect(formatPct(null)).toBe('—');
  });
});

describe('fechas', () => {
  it('formatDate no corre el día por zona horaria', () => {
    expect(formatDate('2026-03-05')).toBe('05/03/2026');
    expect(formatDate('2026-01-01T00:00:00')).toBe('01/01/2026');
  });
  it('formatShortDate', () => {
    expect(formatShortDate('2026-03-05')).toBe('05/03');
  });
  it('formatDateTime incluye hora cuando existe', () => {
    expect(formatDateTime('2026-03-05T14:30:12.5')).toBe('05/03/2026 14:30');
    expect(formatDateTime('2026-03-05')).toBe('05/03/2026');
    expect(formatDateTime(null)).toBe('—');
  });
});

describe('formatStatus', () => {
  it('humaniza estados internos', () => {
    expect(formatStatus('STOCK_BAJO')).toBe('Stock bajo');
    expect(formatStatus('AGOTADO')).toBe('Agotado');
    expect(formatStatus(undefined)).toBe('—');
  });
});
