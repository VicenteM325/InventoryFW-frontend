// Formato de valores para mostrar en pantalla (quetzales, enteros, fechas, porcentajes).
// Siempre en es-GT / formato local: los reportes se leen en español de Guatemala.

const moneyFormat = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const intFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 });

export function formatMoney(value) {
  return `Q ${moneyFormat.format(Number(value) || 0)}`;
}

export function formatInt(value) {
  return intFormat.format(Number(value) || 0);
}

// Variación porcentual con signo explícito: 12.5 -> "+12.5%", -3 -> "-3%", null -> "—".
export function formatPct(value) {
  if (value === null || value === undefined) return '—';
  const n = Number(value);
  const sign = n > 0 ? '+' : '';
  return `${sign}${n}%`;
}

// El backend serializa LocalDate como "2026-03-05" y LocalDateTime como
// "2026-03-05T14:30:00". Se parte el texto a mano en vez de usar new Date(),
// que interpretaría "2026-03-05" como UTC y en zonas con offset negativo
// (Guatemala) mostraría el día anterior.
export function formatDate(iso) {
  if (!iso) return '—';
  const [year, month, day] = String(iso).slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export function formatShortDate(iso) {
  if (!iso) return '';
  const [, month, day] = String(iso).slice(0, 10).split('-');
  return `${day}/${month}`;
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const time = String(iso).slice(11, 16);
  return time ? `${formatDate(iso)} ${time}` : formatDate(iso);
}

// STOCK_BAJO -> "Stock bajo"
export function formatStatus(raw) {
  if (!raw) return '—';
  const text = String(raw).replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
