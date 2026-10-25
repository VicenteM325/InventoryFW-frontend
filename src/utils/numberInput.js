// Filtros para campos numéricos escritos a mano (sin flechas de subir/bajar ni signo negativo).

/** Deja solo dígitos: "-5" -> "5", "1a2" -> "12". */
export function digitsOnly(value) {
  return String(value ?? '').replace(/\D/g, '');
}

/** Deja un decimal positivo con un solo punto y hasta `decimals` decimales: "1,5x" -> "1.5". */
export function decimalOnly(value, decimals = 2) {
  const cleaned = String(value ?? '').replace(',', '.').replace(/[^\d.]/g, '');
  const [whole, ...rest] = cleaned.split('.');
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join('').slice(0, decimals)}`;
}
