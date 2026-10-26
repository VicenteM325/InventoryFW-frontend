import { useEffect, useState } from 'react';
import { documentService } from '@/services/documentService';

// Las medidas solo cambian al desplegar el backend: se piden una vez y se
// reutilizan mientras la pestaña siga abierta. Si falla, el siguiente montaje
// vuelve a intentarlo.
let specsPromise = null;

function loadSpecs() {
  if (!specsPromise) {
    specsPromise = documentService.getIdPhotoSpecs().catch((err) => {
      specsPromise = null;
      throw err;
    });
  }
  return specsPromise;
}

/** Devuelve `specs` indexadas por tipo (CEDULA, PASAPORTE), o `error` si no se pudieron cargar. */
export function useIdPhotoSpecs() {
  const [state, setState] = useState({ specs: null, error: '' });

  useEffect(() => {
    let active = true;
    loadSpecs()
      .then((list) => {
        if (active) setState({ specs: Object.fromEntries(list.map((spec) => [spec.type, spec])), error: '' });
      })
      .catch(() => {
        if (active) setState({ specs: null, error: 'No se pudieron cargar las medidas de las fotos' });
      });
    return () => {
      active = false;
    };
  }, []);

  return state;
}
