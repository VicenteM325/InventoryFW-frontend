import { describe, expect, it } from 'vitest';
import { normalizeRotation, rotatedDimensions, rotationTransform } from './imageDisplay';

describe('normalizeRotation', () => {
  it('lleva cualquier ángulo a 0-359', () => {
    expect(normalizeRotation(450)).toBe(90);
    expect(normalizeRotation(-90)).toBe(270);
    expect(normalizeRotation(360)).toBe(0);
  });
});

describe('rotatedDimensions', () => {
  it('intercambia ancho y alto en 90 y 270', () => {
    expect(rotatedDimensions(400, 200, 0)).toEqual({ width: 400, height: 200 });
    expect(rotatedDimensions(400, 200, 90)).toEqual({ width: 200, height: 400 });
    expect(rotatedDimensions(400, 200, 180)).toEqual({ width: 400, height: 200 });
    expect(rotatedDimensions(400, 200, 270)).toEqual({ width: 200, height: 400 });
  });
});

describe('rotationTransform', () => {
  it('90° horario: el origen de la imagen va a la esquina superior derecha', () => {
    expect(rotationTransform(400, 200, 90)).toEqual({
      canvasWidth: 200, canvasHeight: 400, translateX: 200, translateY: 0, angle: Math.PI / 2,
    });
  });

  it('180°: el origen va a la esquina inferior derecha', () => {
    expect(rotationTransform(400, 200, 180)).toEqual({
      canvasWidth: 400, canvasHeight: 200, translateX: 400, translateY: 200, angle: Math.PI,
    });
  });

  it('270°: el origen va a la esquina inferior izquierda', () => {
    expect(rotationTransform(400, 200, 270)).toEqual({
      canvasWidth: 200, canvasHeight: 400, translateX: 0, translateY: 400, angle: -Math.PI / 2,
    });
  });

  it('0° no transforma', () => {
    expect(rotationTransform(400, 200, 0)).toEqual({
      canvasWidth: 400, canvasHeight: 200, translateX: 0, translateY: 0, angle: 0,
    });
  });
});
