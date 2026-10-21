// El proxy de Netlify corta cada petición a los 26 s, contando la subida, y
// el documento DPI final solo usa 1011x638 px por cara: subir la foto
// original de un celular (4-10 MB) no aporta calidad y arriesga el timeout.
// Es el mismo límite que aplica el backend (ImageCropServiceImpl).
const MAX_DIMENSION_PX = 2560;
const JPEG_QUALITY = 0.9;

// Devuelve la foto reducida a MAX_DIMENSION_PX en su lado mayor (en JPEG),
// o la original si ya es más chica o si el navegador no logra procesarla
// (en ese caso el backend la reduce igual).
export async function downscaleImage(file) {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    // Al decodificar, el navegador ya aplica la orientación EXIF: el canvas
    // queda derecho y el JPEG resultante no necesita esa etiqueta.
    await image.decode();

    const longestSide = Math.max(image.naturalWidth, image.naturalHeight);
    if (longestSide <= MAX_DIMENSION_PX) {
      return file;
    }

    const scale = MAX_DIMENSION_PX / longestSide;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(image.naturalWidth * scale);
    canvas.height = Math.round(image.naturalHeight * scale);
    canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY));
    if (!blob) {
      return file;
    }
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}
