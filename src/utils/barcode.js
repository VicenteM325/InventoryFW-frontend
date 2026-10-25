// Utilidades para códigos de barras leídos con la cámara o escritos a mano.

// Formatos que se intentan leer: los de empaque de productos (EAN/UPC) y los
// industriales más comunes. Acotarlos acelera y hace más fiable la lectura.
export const SCAN_FORMAT_NAMES = ['EAN_13', 'EAN_8', 'UPC_A', 'UPC_E', 'CODE_128', 'CODE_39'];

// Quita espacios y saltos de línea (un lector o un pegado pueden traerlos).
export function normalizeBarcode(raw) {
  return String(raw ?? '').replace(/\s+/g, '');
}

// UPC-A (12 dígitos) es un EAN-13 con un 0 a la izquierda: el mismo producto
// puede leerse de cualquiera de las dos formas, así que se comparan en EAN-13.
function canonical(code) {
  const normalized = normalizeBarcode(code);
  return /^\d{12}$/.test(normalized) ? `0${normalized}` : normalized;
}

// Devuelve el producto cuyo código coincide con el leído, o null.
export function findProductByBarcode(products, code) {
  const wanted = canonical(code);
  if (!wanted) return null;
  return products.find((p) => p.barcode && canonical(p.barcode) === wanted) || null;
}
