// Orientación de la imagen que se muestra bajo el marco de recorte. El
// backend gira la foto original con el mismo `rotation` (en sentido
// horario), así que el marco, dibujado sobre esta imagen ya girada, vale
// tal cual en el servidor.

const MAX_PREVIEW_SIDE_PX = 1280;
const PREVIEW_JPEG_QUALITY = 0.85;

export function normalizeRotation(rotation) {
  return ((rotation % 360) + 360) % 360;
}

// Dimensiones de la imagen después de girarla.
export function rotatedDimensions(width, height, rotation) {
  const normalized = normalizeRotation(rotation);
  return normalized === 90 || normalized === 270
    ? { width: height, height: width }
    : { width, height };
}

// Transformación del canvas para dibujar la imagen girada en sentido horario
// (las mismas que usa ImageRotationUtil en el backend).
export function rotationTransform(width, height, rotation) {
  const normalized = normalizeRotation(rotation);
  const { width: canvasWidth, height: canvasHeight } = rotatedDimensions(width, height, normalized);
  switch (normalized) {
    case 90:
      return { canvasWidth, canvasHeight, translateX: canvasWidth, translateY: 0, angle: Math.PI / 2 };
    case 180:
      return { canvasWidth, canvasHeight, translateX: canvasWidth, translateY: canvasHeight, angle: Math.PI };
    case 270:
      return { canvasWidth, canvasHeight, translateX: 0, translateY: canvasHeight, angle: -Math.PI / 2 };
    default:
      return { canvasWidth, canvasHeight, translateX: 0, translateY: 0, angle: 0 };
  }
}

// Devuelve { url, width, height } con la foto derecha (el navegador aplica
// la orientación EXIF al decodificar), girada y reducida para mostrarla.
// Quien la llama debe liberar `url` con URL.revokeObjectURL.
export async function renderRotatedPreview(file, rotation, maxSide = MAX_PREVIEW_SIDE_PX) {
  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = sourceUrl;
    await image.decode();

    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
    const drawWidth = Math.max(1, Math.round(image.naturalWidth * scale));
    const drawHeight = Math.max(1, Math.round(image.naturalHeight * scale));
    const t = rotationTransform(drawWidth, drawHeight, rotation);

    const canvas = document.createElement('canvas');
    canvas.width = t.canvasWidth;
    canvas.height = t.canvasHeight;
    const ctx = canvas.getContext('2d');
    ctx.translate(t.translateX, t.translateY);
    ctx.rotate(t.angle);
    ctx.drawImage(image, 0, 0, drawWidth, drawHeight);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', PREVIEW_JPEG_QUALITY));
    if (!blob) {
      throw new Error('No se pudo preparar la imagen');
    }
    return { url: URL.createObjectURL(blob), width: t.canvasWidth, height: t.canvasHeight };
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}
