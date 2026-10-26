import { useEffect, useRef, useState } from 'react';
import { documentService } from '@/services/documentService';

const PREVIEW_DEBOUNCE_MS = 400;

/**
 * Vista previa de una copia (recorte + ajuste ya procesados por el backend).
 * Mientras el usuario arrastra el marco cada cambio reinicia el temporizador,
 * así que solo se pide cuando se detiene; si aun así llega otro cambio con
 * una petición en vuelo, esa se cancela para no ocupar al servidor con una
 * respuesta que ya no se va a mostrar.
 */
export function useIdPhotoPreview({ file, type, rotation, settings, crop }) {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const previewUrlRef = useRef(null);

  const { brightness, contrast, sharpness } = settings;
  const cropKey = crop ? `${crop.cropX},${crop.cropY},${crop.cropWidth},${crop.cropHeight}` : '';

  useEffect(() => {
    if (!file || !crop) {
      setPreviewUrl(null);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const blob = await documentService.previewIdPhoto({
          file, type, settings: { brightness, contrast, sharpness }, rotation, crop, signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        const url = URL.createObjectURL(blob);
        if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = url;
        setPreviewUrl(url);
        setLoading(false);
      } catch {
        if (!controller.signal.aborted) {
          setPreviewUrl(null);
          setLoading(false);
        }
      }
    }, PREVIEW_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, type, rotation, brightness, contrast, sharpness, cropKey]);

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
  }, []);

  return { previewUrl, loading };
}
