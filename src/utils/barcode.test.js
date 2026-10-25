import { describe, expect, it } from 'vitest';
import { findProductByBarcode, normalizeBarcode, SCAN_FORMAT_NAMES } from './barcode';

const products = [
  { productId: 1, name: 'Funda', barcode: '7501031311309' },
  { productId: 2, name: 'Cable', barcode: '036000291452' },
  { productId: 3, name: 'Sin código', barcode: '' },
  { productId: 4, name: 'Nulo', barcode: null },
  { productId: 5, name: 'Interno', barcode: 'WIL-0001' },
];

describe('normalizeBarcode', () => {
  it('quita espacios y saltos de línea', () => {
    expect(normalizeBarcode('  7501031311309\n')).toBe('7501031311309');
    expect(normalizeBarcode('7501 0313 11309')).toBe('7501031311309');
  });
  it('tolera valores vacíos', () => {
    expect(normalizeBarcode(null)).toBe('');
    expect(normalizeBarcode(undefined)).toBe('');
  });
});

describe('findProductByBarcode', () => {
  it('encuentra por coincidencia exacta', () => {
    expect(findProductByBarcode(products, '7501031311309').productId).toBe(1);
    expect(findProductByBarcode(products, 'WIL-0001').productId).toBe(5);
  });
  it('ignora espacios del código leído', () => {
    expect(findProductByBarcode(products, ' 7501031311309 ').productId).toBe(1);
  });
  it('trata UPC-A (12 dígitos) como EAN-13 con 0 inicial, en ambos sentidos', () => {
    expect(findProductByBarcode(products, '0036000291452').productId).toBe(2);
    expect(findProductByBarcode([{ productId: 9, barcode: '0123456789012' }], '123456789012').productId).toBe(9);
  });
  it('no confunde códigos distintos ni parciales', () => {
    expect(findProductByBarcode(products, '7501031311308')).toBeNull();
    expect(findProductByBarcode(products, '750103131130')).toBeNull();
  });
  it('devuelve null para código vacío o productos sin código', () => {
    expect(findProductByBarcode(products, '')).toBeNull();
    expect(findProductByBarcode(products, '   ')).toBeNull();
    expect(findProductByBarcode([{ productId: 3, barcode: '' }], '')).toBeNull();
  });
});

describe('SCAN_FORMAT_NAMES', () => {
  it('incluye los formatos de empaque más comunes', () => {
    expect(SCAN_FORMAT_NAMES).toEqual(expect.arrayContaining(['EAN_13', 'EAN_8', 'UPC_A']));
  });
});
