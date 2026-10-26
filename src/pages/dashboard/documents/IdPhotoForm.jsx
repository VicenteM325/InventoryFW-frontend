import React, { useEffect, useState } from 'react';
import {
  Card,
  Typography,
  Button,
  Input,
  Select,
  Option,
} from "@material-tailwind/react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { documentService } from "@/services/documentService";
import { useIdPhotoPreview } from "@/hooks/useIdPhotoPreview";
import { PhotoCropFrame } from "@/components/PhotoCropFrame";
import { ImageAdjustmentSliders } from "@/components/ImageAdjustmentSliders";
import { GeneratedDocumentCard } from "@/components/GeneratedDocumentCard";
import { extractErrorMessage } from "@/utils/fileDownload";
import { downscaleImage } from "@/utils/imageDownscale";
import { renderRotatedPreview } from "@/utils/imageDisplay";
import { notifyNotificationsChanged } from "@/utils/notificationEvents";
import { MAX_ZOOM, defaultFrame, toCropParams, zoomFrame, zoomOf } from "@/utils/photoCrop";

const PHOTO_LABELS = { CEDULA: 'cédula', PASAPORTE: 'pasaporte' };
const FORMATS = [{ value: 'PDF', label: 'PDF' }, { value: 'DOCX', label: 'Word (.docx)' }];
const DEFAULT_SETTINGS = { brightness: 0, contrast: 0, sharpness: 15 };

// "4×6" a partir de la hoja que informa el backend (sin importar si la mejor
// orientación es vertical u horizontal).
function sheetSizeLabel(spec) {
  const [shorter, longer] = [spec.sheetWidthPt, spec.sheetHeightPt].sort((a, b) => a - b);
  return `${shorter / 72}×${longer / 72} in`;
}

/**
 * Hoja de fotos tamaño cédula o pasaporte: sube una foto, el operador
 * encuadra el rostro con un marco de la proporción del documento y el
 * sistema repite la foto en una hoja 4x6 lista para imprimir. `spec` son las
 * medidas y la capacidad que informa el backend (GET /id-photo/specs).
 */
export function IdPhotoForm({ type, spec, specError }) {
  const label = PHOTO_LABELS[type];
  const inputId = `id-photo-${type}`;
  // La misma proporción en píxeles con la que el backend recorta.
  const aspect = spec ? spec.widthPx / spec.heightPx : null;

  const [file, setFile] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [display, setDisplay] = useState(null); // { url, width, height }: la foto derecha y girada
  const [frame, setFrame] = useState(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [copies, setCopies] = useState(null); // null = llenar la hoja
  const [clientName, setClientName] = useState('');
  const [format, setFormat] = useState('PDF');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { blob, filename, format }

  const effectiveCopies = copies ?? spec?.capacity ?? 1;
  const crop = frame ? toCropParams(frame) : null;
  const preview = useIdPhotoPreview({ file, type, rotation, settings, crop });

  // El marco vive en el espacio de la foto ya girada, así que cada giro (o
  // una foto nueva) lo reinicia al marco centrado más grande.
  useEffect(() => {
    if (!file) {
      setDisplay(null);
      setFrame(null);
      return undefined;
    }

    let cancelled = false;
    let createdUrl = null;
    renderRotatedPreview(file, rotation)
      .then((image) => {
        if (cancelled) {
          URL.revokeObjectURL(image.url);
          return;
        }
        createdUrl = image.url;
        setDisplay(image);
        setFrame(aspect ? defaultFrame(image.width, image.height, aspect) : null);
      })
      .catch(() => {
        if (!cancelled) {
          setDisplay(null);
          setFrame(null);
          setError('No se pudo leer la foto');
        }
      });

    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [file, rotation, aspect]);

  // La foto se reduce una sola vez al elegirla: el marco, la vista previa y
  // la generación usan ese mismo archivo.
  const handleFileChange = async (selected) => {
    const prepared = selected ? await downscaleImage(selected) : null;
    setFile(prepared);
    setRotation(0);
    setResult(null);
    setError('');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFileChange(e.dataTransfer.files?.[0] ?? null);
  };

  const handleReset = () => {
    setFile(null);
    setRotation(0);
    setSettings(DEFAULT_SETTINGS);
    setCopies(null);
    setClientName('');
    setFormat('PDF');
    setResult(null);
    setError('');
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!file || !crop || !spec) {
      setError('Debes adjuntar la foto');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);
    try {
      const blob = await documentService.generateIdPhoto({
        file, type, copies: effectiveCopies, format, clientName, settings, rotation, crop,
      });
      const extension = format === 'DOCX' ? 'docx' : 'pdf';
      setResult({ blob, filename: `foto_${type.toLowerCase()}_${Date.now()}.${extension}`, format });
      notifyNotificationsChanged();
    } catch (err) {
      setError(await extractErrorMessage(err, 'Error al generar el documento'));
    } finally {
      setLoading(false);
    }
  };

  const zoom = frame && display ? zoomOf(frame, display.width, display.height, aspect) : 1;

  return (
    <div>
      <Card className="p-6">
        <form onSubmit={handleGenerate} className="space-y-6">
          {specError && (
            <Typography variant="small" color="red">
              {specError}
            </Typography>
          )}
          {spec && (
            <Typography variant="small" color="gray">
              Foto tamaño {label}: {spec.widthCm} × {spec.heightCm} cm. En una hoja de {sheetSizeLabel(spec)} caben
              hasta {spec.capacity} copias.
            </Typography>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                Foto de la persona
              </Typography>
              <label
                htmlFor={inputId}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-gray-200 bg-blue-gray-50/50 p-4 text-center hover:border-blue-400"
              >
                <Typography color="blue-gray" className="font-medium">
                  {file ? 'Cambiar la foto' : 'Arrastra la foto aquí'}
                </Typography>
                <Typography variant="small" color="gray">
                  o haz clic para seleccionarla
                </Typography>
              </label>
              <input
                id={inputId}
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />
              {file && (
                <Typography variant="small" color="gray" className="mt-1 truncate">
                  {file.name}
                </Typography>
              )}

              {file && display && frame && (
                <div className="mt-3">
                  <div className="mb-1 flex flex-wrap items-center justify-between gap-x-2">
                    <Typography variant="small" color="blue-gray" className="font-medium">
                      Encuadra el rostro (arrastra el marco o sus esquinas)
                    </Typography>
                    <Button
                      size="sm"
                      variant="text"
                      className="flex items-center gap-1 whitespace-nowrap p-1"
                      onClick={() => setRotation((r) => (r + 90) % 360)}
                      type="button"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                      Rotar 90°
                    </Button>
                  </div>
                  <PhotoCropFrame
                    imageUrl={display.url}
                    imageWidth={display.width}
                    imageHeight={display.height}
                    aspect={aspect}
                    frame={frame}
                    onChange={setFrame}
                  />
                  <div className="mt-2">
                    <Typography variant="small" color="gray">Zoom ({zoom.toFixed(1)}×)</Typography>
                    <input
                      type="range" min="1" max={MAX_ZOOM} step="0.05" value={zoom}
                      onChange={(e) => setFrame(zoomFrame(frame, Number(e.target.value), display.width, display.height, aspect))}
                      className="w-full"
                      aria-label="Zoom del marco"
                    />
                  </div>
                </div>
              )}
              {file && !display && (
                <Typography variant="small" color="gray" className="mt-3">
                  Preparando la foto...
                </Typography>
              )}
            </div>

            <div>
              <Typography variant="small" color="blue-gray" className="mb-2 font-medium">
                Vista previa de una copia
              </Typography>
              <div className="flex h-72 items-center justify-center rounded-lg border border-blue-gray-100 bg-white p-2">
                {preview.previewUrl ? (
                  <img
                    src={preview.previewUrl}
                    alt={`Vista previa de la foto tamaño ${label}`}
                    className="max-h-full max-w-full border border-blue-gray-100 object-contain"
                  />
                ) : (
                  <Typography variant="small" color="gray">
                    {file ? (preview.loading ? 'Procesando...' : 'Sin vista previa disponible') : 'Sube una foto para ver el resultado'}
                  </Typography>
                )}
              </div>
              {spec && (
                <Typography variant="small" color="gray" className="mt-1">
                  {spec.widthPx} × {spec.heightPx} px ({spec.dpi} dpi)
                </Typography>
              )}
            </div>
          </div>

          <ImageAdjustmentSliders
            title="Ajustes de imagen"
            settings={settings}
            onChange={(change) => setSettings((current) => ({ ...current, ...change }))}
          />

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* El Select de Material Tailwind lee sus opciones solo al montarse: sin esta
                key, las opciones 1..capacidad que llegan después de cargar las medidas
                no se reconocen y el valor elegido se ve en blanco. */}
            <Select
              key={spec?.capacity ?? 0}
              label={`Copias en la hoja${spec ? ` (máx. ${spec.capacity})` : ''}`}
              value={String(effectiveCopies)}
              onChange={(value) => setCopies(Number(value))}
              disabled={!spec}
            >
              {Array.from({ length: spec?.capacity ?? 1 }, (_, i) => (
                <Option key={i + 1} value={String(i + 1)}>{i + 1}</Option>
              ))}
            </Select>
            <Input
              label="Nombre del cliente (opcional)"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
            <Select label="Formato de salida" value={format} onChange={(value) => setFormat(value)}>
              {FORMATS.map((f) => (
                <Option key={f.value} value={f.value}>{f.label}</Option>
              ))}
            </Select>
          </div>

          {error && (
            <Typography variant="small" color="red">
              {error}
            </Typography>
          )}

          <div className="flex justify-end gap-4">
            <Button type="button" variant="text" color="blue-gray" onClick={handleReset}>
              Limpiar
            </Button>
            <Button type="submit" color="blue" disabled={loading || !file || !frame || !spec}>
              {loading ? 'Generando...' : 'Generar hoja de fotos'}
            </Button>
          </div>
        </form>
      </Card>

      {result && (
        <GeneratedDocumentCard
          result={result}
          hint={spec && `Papel fotográfico ${sheetSizeLabel(spec)}. Al imprimir elige tamaño real (100 %), sin "ajustar a la página", para que la foto mida ${spec.widthCm} × ${spec.heightCm} cm.`}
        />
      )}
    </div>
  );
}

export default IdPhotoForm;
