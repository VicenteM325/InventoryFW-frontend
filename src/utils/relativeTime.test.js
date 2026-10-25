import { describe, expect, it } from 'vitest';
import { relativeTime } from './relativeTime';

const now = new Date('2026-03-10T12:00:00');

describe('relativeTime', () => {
  it('describe intervalos recientes', () => {
    expect(relativeTime('2026-03-10T11:59:40', now)).toBe('hace un momento');
    expect(relativeTime('2026-03-10T11:55:00', now)).toBe('hace 5 min');
    expect(relativeTime('2026-03-10T09:00:00', now)).toBe('hace 3 h');
    expect(relativeTime('2026-03-07T12:00:00', now)).toBe('hace 3 d');
  });

  it('devuelve vacío con fechas inválidas', () => {
    expect(relativeTime('no es fecha', now)).toBe('');
  });
});
