import { describe, expect, it } from 'vitest';
import {
  MAX_ZOOM,
  clampCopies,
  defaultFrame,
  maxFrame,
  minFrameWidth,
  moveFrame,
  resizeFrame,
  toCropParams,
  zoomFrame,
  zoomOf,
} from './photoCrop';

const CEDULA = 3.1 / 3.9;
const PASAPORTE = 1;
const EPS = 1e-9;

// Proporción del marco medida en píxeles de la imagen.
const pixelAspect = (frame, w, h) => (frame.width * w) / (frame.height * h);

const IMAGES = [
  { name: 'horizontal', w: 1600, h: 1200 },
  { name: 'vertical', w: 1200, h: 1600 },
  { name: 'cuadrada', w: 1000, h: 1000 },
  { name: 'muy panorámica', w: 2560, h: 640 },
];

const insideImage = (f) => f.x >= -EPS && f.y >= -EPS && f.x + f.width <= 1 + EPS && f.y + f.height <= 1 + EPS;

describe('maxFrame', () => {
  it('en una foto horizontal manda el alto', () => {
    const max = maxFrame(1600, 1200, CEDULA);
    expect(max.height).toBe(1);
    expect(pixelAspect({ ...max }, 1600, 1200)).toBeCloseTo(CEDULA, 9);
  });

  it('en una foto muy panorámica y marco cuadrado también manda el alto', () => {
    const max = maxFrame(2560, 640, PASAPORTE);
    expect(max.height).toBe(1);
    expect(max.width).toBeCloseTo(0.25, 9);
  });

  it('si la foto es más angosta que la proporción, manda el ancho', () => {
    const max = maxFrame(300, 1200, PASAPORTE);
    expect(max.width).toBe(1);
    expect(max.height).toBeCloseTo(0.25, 9);
  });
});

describe('defaultFrame', () => {
  it.each(IMAGES)('queda centrado, dentro de la imagen y con la proporción ($name)', ({ w, h }) => {
    for (const aspect of [CEDULA, PASAPORTE]) {
      const frame = defaultFrame(w, h, aspect);
      expect(insideImage(frame)).toBe(true);
      expect(pixelAspect(frame, w, h)).toBeCloseTo(aspect, 9);
      expect(frame.x + frame.width / 2).toBeCloseTo(0.5, 9);
      expect(frame.y + frame.height / 2).toBeCloseTo(0.5, 9);
    }
  });
});

describe('moveFrame', () => {
  const frame = { x: 0.2, y: 0.2, width: 0.4, height: 0.5 };

  it('desplaza sin cambiar el tamaño', () => {
    const moved = moveFrame(frame, 0.1, -0.1);
    expect(moved.x).toBeCloseTo(0.3, 9);
    expect(moved.y).toBeCloseTo(0.1, 9);
    expect(moved.width).toBe(0.4);
    expect(moved.height).toBe(0.5);
  });

  it('no sale por ningún borde', () => {
    expect(moveFrame(frame, -1, 0).x).toBe(0);
    expect(moveFrame(frame, 1, 0).x).toBeCloseTo(0.6, 9);
    expect(moveFrame(frame, 0, -1).y).toBe(0);
    expect(moveFrame(frame, 0, 1).y).toBeCloseTo(0.5, 9);
  });
});

describe('resizeFrame', () => {
  const w = 1600;
  const h = 1200;
  const frame = defaultFrame(w, h, CEDULA, 0.5);
  const corners = {
    topLeft: { anchor: (f) => ({ x: f.x + f.width, y: f.y + f.height }), pointer: (f) => ({ x: f.x - 0.05, y: f.y - 0.05 }) },
    topRight: { anchor: (f) => ({ x: f.x, y: f.y + f.height }), pointer: (f) => ({ x: f.x + f.width + 0.05, y: f.y - 0.05 }) },
    bottomRight: { anchor: (f) => ({ x: f.x, y: f.y }), pointer: (f) => ({ x: f.x + f.width + 0.05, y: f.y + f.height + 0.05 }) },
    bottomLeft: { anchor: (f) => ({ x: f.x + f.width, y: f.y }), pointer: (f) => ({ x: f.x - 0.05, y: f.y + f.height + 0.05 }) },
  };

  it.each(Object.keys(corners))('esquina %s: deja fija la opuesta y conserva la proporción', (corner) => {
    const resized = resizeFrame(frame, corner, corners[corner].pointer(frame), w, h, CEDULA);
    const before = corners[corner].anchor(frame);
    const after = corners[corner].anchor(resized);

    expect(after.x).toBeCloseTo(before.x, 9);
    expect(after.y).toBeCloseTo(before.y, 9);
    expect(pixelAspect(resized, w, h)).toBeCloseTo(CEDULA, 9);
    expect(resized.width).toBeGreaterThan(frame.width);
    expect(insideImage(resized)).toBe(true);
  });

  it('no deja crecer el marco más allá de la imagen', () => {
    const resized = resizeFrame(frame, 'bottomRight', { x: 5, y: 5 }, w, h, CEDULA);
    expect(insideImage(resized)).toBe(true);
    expect(pixelAspect(resized, w, h)).toBeCloseTo(CEDULA, 9);
  });

  it('no baja del tamaño mínimo', () => {
    const resized = resizeFrame(frame, 'bottomRight', { x: frame.x, y: frame.y }, w, h, CEDULA);
    expect(resized.width).toBeCloseTo(minFrameWidth(w, h, CEDULA), 9);
    expect(pixelAspect(resized, w, h)).toBeCloseTo(CEDULA, 9);
  });

  it('sigue al puntero aunque lo arrastre solo en vertical', () => {
    const resized = resizeFrame(frame, 'bottomRight', { x: frame.x + frame.width, y: frame.y + frame.height + 0.1 }, w, h, CEDULA);
    expect(resized.height).toBeGreaterThan(frame.height);
    expect(pixelAspect(resized, w, h)).toBeCloseTo(CEDULA, 9);
  });

  it('pegado a un borde sigue siendo un marco válido', () => {
    const edge = { x: 0, y: 0, ...maxFrame(w, h, CEDULA), width: 0.3, height: 0.3 / ((CEDULA * h) / w) };
    const resized = resizeFrame(edge, 'topLeft', { x: -1, y: -1 }, w, h, CEDULA);
    expect(insideImage(resized)).toBe(true);
    expect(Number.isFinite(resized.width)).toBe(true);
  });
});

describe('zoomFrame / zoomOf', () => {
  it('zoom 1 es el marco más grande y MAX_ZOOM el más chico', () => {
    const frame = defaultFrame(1600, 1200, PASAPORTE);

    const full = zoomFrame(frame, 1, 1600, 1200, PASAPORTE);
    const tiny = zoomFrame(frame, MAX_ZOOM, 1600, 1200, PASAPORTE);

    expect(full.height).toBeCloseTo(1, 9);
    expect(tiny.width / full.width).toBeCloseTo(1 / MAX_ZOOM, 9);
    expect(zoomOf(full, 1600, 1200, PASAPORTE)).toBeCloseTo(1, 9);
    expect(zoomOf(tiny, 1600, 1200, PASAPORTE)).toBeCloseTo(MAX_ZOOM, 9);
  });

  it('acercar mantiene el centro y la proporción', () => {
    const frame = defaultFrame(1600, 1200, CEDULA, 0.6);
    const zoomed = zoomFrame(frame, 3, 1600, 1200, CEDULA);

    expect(zoomed.x + zoomed.width / 2).toBeCloseTo(frame.x + frame.width / 2, 9);
    expect(zoomed.y + zoomed.height / 2).toBeCloseTo(frame.y + frame.height / 2, 9);
    expect(pixelAspect(zoomed, 1600, 1200)).toBeCloseTo(CEDULA, 9);
    expect(insideImage(zoomed)).toBe(true);
  });

  it('al alejar un marco pegado al borde, lo mete dentro de la imagen', () => {
    const edge = { x: 0.7, y: 0.5, width: 0.3, height: 0.3 / ((PASAPORTE * 1200) / 1600) };
    const zoomed = zoomFrame(edge, 1.5, 1600, 1200, PASAPORTE);
    expect(insideImage(zoomed)).toBe(true);
  });

  it('un zoom fuera de rango se acota', () => {
    const frame = defaultFrame(1000, 1000, PASAPORTE);
    expect(zoomFrame(frame, 0, 1000, 1000, PASAPORTE).width).toBeCloseTo(1, 9);
    expect(zoomFrame(frame, 99, 1000, 1000, PASAPORTE).width).toBeCloseTo(1 / MAX_ZOOM, 9);
  });
});

describe('toCropParams', () => {
  it('redondea a 6 decimales con los nombres que espera el backend', () => {
    const params = toCropParams({ x: 0.123456789, y: 0.2, width: 0.5555555555, height: 0.4 });
    expect(params).toEqual({ cropX: 0.123457, cropY: 0.2, cropWidth: 0.555556, cropHeight: 0.4 });
  });
});

describe('clampCopies', () => {
  it('acota entre 1 y la capacidad', () => {
    expect(clampCopies(5, 9)).toBe(5);
    expect(clampCopies(0, 9)).toBe(1);
    expect(clampCopies(-3, 9)).toBe(1);
    expect(clampCopies(12, 9)).toBe(9);
    expect(clampCopies('4', 9)).toBe(4);
  });

  it('si no es un número, llena la hoja', () => {
    expect(clampCopies('abc', 9)).toBe(9);
    expect(clampCopies(undefined, 2)).toBe(2);
  });
});
