// Rangos de fechas para los filtros de reportes. Las fechas viajan como "YYYY-MM-DD".

const MAX_RANGE_DAYS = 366;
const DAY_MS = 24 * 60 * 60 * 1000;

// Se arma desde los componentes locales: toISOString() convertiría a UTC y en una
// zona horaria negativa (America/Guatemala) adelantaría el día por la tarde/noche.
export function toISODate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  copy.setDate(copy.getDate() + days);
  return copy;
}

// now se inyecta para poder probar con una fecha fija.
export function presetRanges(now = new Date()) {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  return [
    { id: 'today', label: 'Hoy', from: toISODate(today), to: toISODate(today) },
    { id: '7d', label: '7 días', from: toISODate(addDays(today, -6)), to: toISODate(today) },
    { id: '30d', label: '30 días', from: toISODate(addDays(today, -29)), to: toISODate(today) },
    { id: 'month', label: 'Este mes', from: toISODate(monthStart), to: toISODate(today) },
    { id: 'lastMonth', label: 'Mes anterior', from: toISODate(lastMonthStart), to: toISODate(lastMonthEnd) },
  ];
}

// Devuelve '' si el rango es válido, o el mensaje de error.
export function validateRange(from, to) {
  if (!from || !to) return 'Selecciona las fechas de inicio y fin';
  if (from > to) return 'La fecha de inicio no puede ser posterior a la de fin';
  const days = Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1;
  if (days > MAX_RANGE_DAYS) return `El rango máximo es de ${MAX_RANGE_DAYS} días`;
  return '';
}

// Id del preset que coincide exactamente con el rango, o null si es personalizado.
export function matchingPreset(from, to, now = new Date()) {
  const preset = presetRanges(now).find((p) => p.from === from && p.to === to);
  return preset ? preset.id : null;
}
