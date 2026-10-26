import api from './api';

const API_URL = '/api/documents';

export const documentService = {
  generateDpi: (front, back, format, clientName, settings, frontRotation, backRotation, frontCorners, backCorners) => {
    const formData = new FormData();
    formData.append('front', front);
    formData.append('back', back);
    formData.append('format', format);
    if (clientName) {
      formData.append('clientName', clientName);
    }
    formData.append('brightness', settings.brightness);
    formData.append('contrast', settings.contrast);
    formData.append('sharpness', settings.sharpness);
    formData.append('frontRotation', frontRotation);
    formData.append('backRotation', backRotation);
    if (frontCorners) {
      formData.append('frontCorners', JSON.stringify(frontCorners));
    }
    if (backCorners) {
      formData.append('backCorners', JSON.stringify(backCorners));
    }
    return api
      .post(`${API_URL}/dpi`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
      })
      .then((res) => res.data);
  },

  previewDpiImage: (file, side, settings, rotation, corners) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('side', side);
    formData.append('brightness', settings.brightness);
    formData.append('contrast', settings.contrast);
    formData.append('sharpness', settings.sharpness);
    formData.append('rotation', rotation);
    if (corners) {
      formData.append('corners', JSON.stringify(corners));
    }
    return api
      .post(`${API_URL}/dpi/preview`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
      })
      .then((res) => res.data);
  },

  detectCorners: (file, side, rotation) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('side', side);
    formData.append('rotation', rotation);
    return api
      .post(`${API_URL}/dpi/detect-corners`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((res) => res.data);
  },

  // Medidas y capacidad de las hojas de fotos (cédula y pasaporte).
  getIdPhotoSpecs: () => api.get(`${API_URL}/id-photo/specs`).then((res) => res.data),

  // `crop` son los parámetros de toCropParams (cropX, cropY, cropWidth,
  // cropHeight) o null para que el backend recorte centrado.
  previewIdPhoto: ({ file, type, settings, rotation, crop, signal }) => {
    const formData = buildIdPhotoForm({ file, type, settings, rotation, crop });
    return api
      .post(`${API_URL}/id-photo/preview`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
        signal,
      })
      .then((res) => res.data);
  },

  generateIdPhoto: ({ file, type, copies, format, clientName, settings, rotation, crop }) => {
    const formData = buildIdPhotoForm({ file, type, settings, rotation, crop });
    formData.append('copies', copies);
    formData.append('format', format);
    if (clientName) {
      formData.append('clientName', clientName);
    }
    return api
      .post(`${API_URL}/id-photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        responseType: 'blob',
      })
      .then((res) => res.data);
  },
};

function buildIdPhotoForm({ file, type, settings, rotation, crop }) {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('type', type);
  formData.append('brightness', settings.brightness);
  formData.append('contrast', settings.contrast);
  formData.append('sharpness', settings.sharpness);
  formData.append('rotation', rotation);
  if (crop) {
    for (const [key, value] of Object.entries(crop)) {
      formData.append(key, value);
    }
  }
  return formData;
}
