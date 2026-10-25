import { describe, expect, it } from 'vitest';
import { matchingPreset, presetRanges, toISODate, validateRange } from './dateRanges';

// 15 de marzo de 2026, a las 22:30 (hora local): de noche, donde toISOString() en UTC-6 ya sería el 16.
const NOW = new Date(2026, 2, 15, 22, 30);

describe('toISODate', () => {
  it('usa la fecha local, no la UTC', () => {
    expect(toISODate(NOW)).toBe('2026-03-15');
  });
});

describe('presetRanges', () => {
  const byId = Object.fromEntries(presetRanges(NOW).map((p) => [p.id, p]));

  it('hoy', () => {
    expect(byId.today).toMatchObject({ from: '2026-03-15', to: '2026-03-15' });
  });
  it('7 y 30 días incluyen hoy', () => {
    expect(byId['7d']).toMatchObject({ from: '2026-03-09', to: '2026-03-15' });
    expect(byId['30d']).toMatchObject({ from: '2026-02-14', to: '2026-03-15' });
  });
  it('este mes y mes anterior', () => {
    expect(byId.month).toMatchObject({ from: '2026-03-01', to: '2026-03-15' });
    expect(byId.lastMonth).toMatchObject({ from: '2026-02-01', to: '2026-02-28' });
  });
  it('mes anterior en enero cruza de año', () => {
    const jan = Object.fromEntries(presetRanges(new Date(2026, 0, 10)).map((p) => [p.id, p]));
    expect(jan.lastMonth).toMatchObject({ from: '2025-12-01', to: '2025-12-31' });
  });
});

describe('validateRange', () => {
  it('acepta rangos válidos, incluso de un día', () => {
    expect(validateRange('2026-03-01', '2026-03-01')).toBe('');
    expect(validateRange('2026-01-01', '2026-12-31')).toBe('');
  });
  it('exige ambas fechas', () => {
    expect(validateRange('', '2026-03-01')).not.toBe('');
    expect(validateRange('2026-03-01', '')).not.toBe('');
  });
  it('rechaza inicio posterior al fin', () => {
    expect(validateRange('2026-03-10', '2026-03-01')).toMatch(/posterior/);
  });
  it('rechaza más de 366 días', () => {
    expect(validateRange('2025-01-01', '2026-03-01')).toMatch(/366/);
  });
});

describe('matchingPreset', () => {
  it('reconoce un preset y devuelve null para rangos propios', () => {
    expect(matchingPreset('2026-03-09', '2026-03-15', NOW)).toBe('7d');
    expect(matchingPreset('2026-03-02', '2026-03-04', NOW)).toBeNull();
  });
});
