// Geometría del marco de recorte de fotos tamaño cédula/pasaporte. El marco
// se expresa en fracciones [0,1] de la imagen mostrada (ya derecha y con el
// giro aplicado), igual que lo espera el backend (CropRegion), y mantiene
// siempre la proporción `aspect` (ancho/alto de la foto impresa) medida en
// píxeles, no en fracciones: una fracción de ancho y una de alto de la misma
// imagen no son comparables si la imagen no es cuadrada.

export const MAX_ZOOM = 6;
const DEFAULT_COVERAGE = 0.85;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Ancho en fracciones que corresponde a una unidad de alto en fracciones.
const widthPerHeight = (imgW, imgH, aspect) => (aspect * imgH) / imgW;

// El marco más grande con la proporción `aspect` que cabe en la imagen.
export function maxFrame(imgW, imgH, aspect) {
  const k = widthPerHeight(imgW, imgH, aspect);
  if (k >= 1) {
    // La foto impresa es más ancha, en fracciones, que la imagen: manda el ancho.
    return { width: 1, height: 1 / k };
  }
  return { width: k, height: 1 };
}

export function minFrameWidth(imgW, imgH, aspect) {
  return maxFrame(imgW, imgH, aspect).width / MAX_ZOOM;
}

// Marco centrado, cubriendo `coverage` del máximo posible.
export function defaultFrame(imgW, imgH, aspect, coverage = DEFAULT_COVERAGE) {
  const max = maxFrame(imgW, imgH, aspect);
  const width = max.width * coverage;
  const height = max.height * coverage;
  return { x: (1 - width) / 2, y: (1 - height) / 2, width, height };
}

// Desplaza el marco sin cambiarle el tamaño; no lo deja salir de la imagen.
export function moveFrame(frame, dx, dy) {
  return {
    ...frame,
    x: clamp(frame.x + dx, 0, 1 - frame.width),
    y: clamp(frame.y + dy, 0, 1 - frame.height),
  };
}

const ANCHORS = {
  topLeft: (f) => ({ x: f.x + f.width, y: f.y + f.height }),
  topRight: (f) => ({ x: f.x, y: f.y + f.height }),
  bottomRight: (f) => ({ x: f.x, y: f.y }),
  bottomLeft: (f) => ({ x: f.x + f.width, y: f.y }),
};

// Arrastra una esquina: la esquina opuesta queda fija, la proporción se
// conserva, el marco no sale de la imagen y no baja del tamaño mínimo.
export function resizeFrame(frame, corner, pointer, imgW, imgH, aspect) {
  const anchor = ANCHORS[corner](frame);
  const k = widthPerHeight(imgW, imgH, aspect);
  const growsLeft = corner === 'topLeft' || corner === 'bottomLeft';
  const growsUp = corner === 'topLeft' || corner === 'topRight';

  // El ancho que pide el puntero según cada eje; manda el mayor para que el
  // marco siga al puntero sin importar hacia dónde lo arrastre.
  const requestedWidth = Math.max(Math.abs(pointer.x - anchor.x), Math.abs(pointer.y - anchor.y) * k);

  const availableWidth = Math.min(growsLeft ? anchor.x : 1 - anchor.x, (growsUp ? anchor.y : 1 - anchor.y) * k);
  const minWidth = Math.min(minFrameWidth(imgW, imgH, aspect), availableWidth);
  const width = clamp(requestedWidth, minWidth, availableWidth);
  const height = width / k;

  return {
    x: growsLeft ? anchor.x - width : anchor.x,
    y: growsUp ? anchor.y - height : anchor.y,
    width,
    height,
  };
}

// Zoom actual: 1 = el marco más grande posible, MAX_ZOOM = el más chico.
export function zoomOf(frame, imgW, imgH, aspect) {
  return maxFrame(imgW, imgH, aspect).width / frame.width;
}

// Cambia el zoom alrededor del centro del marco, sin sacarlo de la imagen.
export function zoomFrame(frame, zoom, imgW, imgH, aspect) {
  const max = maxFrame(imgW, imgH, aspect);
  const width = max.width / clamp(zoom, 1, MAX_ZOOM);
  const height = (width / max.width) * max.height;
  const centerX = frame.x + frame.width / 2;
  const centerY = frame.y + frame.height / 2;
  return {
    x: clamp(centerX - width / 2, 0, 1 - width),
    y: clamp(centerY - height / 2, 0, 1 - height),
    width,
    height,
  };
}

// Parámetros multipart para el backend (6 decimales: la región es
// independiente de la resolución, no hace falta más precisión).
export function toCropParams(frame) {
  const round = (value) => Math.round(value * 1e6) / 1e6;
  return {
    cropX: round(frame.x),
    cropY: round(frame.y),
    cropWidth: round(frame.width),
    cropHeight: round(frame.height),
  };
}

// Cantidad de copias válida entre 1 y la capacidad de la hoja.
export function clampCopies(value, max) {
  const parsed = Math.round(Number(value));
  if (!Number.isFinite(parsed)) return max;
  return clamp(parsed, 1, max);
}
