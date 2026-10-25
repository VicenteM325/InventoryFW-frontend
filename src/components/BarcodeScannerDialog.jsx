import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { Dialog, DialogBody, DialogHeader, Button, Typography } from "@material-tailwind/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { normalizeBarcode, SCAN_FORMAT_NAMES } from "@/utils/barcode";

// La cámara lee el mismo código muchas veces por segundo mientras está a la vista.
// Si entre dos lecturas del mismo código pasa menos de este tiempo, sigue siendo la
// misma pasada: solo cuenta de nuevo cuando se aparta el código y se vuelve a mostrar.
const SAME_PASS_GAP_MS = 1200;

function cameraErrorMessage(error) {
  if (typeof window !== "undefined" && (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia)) {
    return "La cámara solo funciona en una conexión segura (HTTPS). Abre el sistema desde su dirección https://.";
  }
  switch (error?.name) {
    case "NotAllowedError":
    case "SecurityError":
      return "No diste permiso para usar la cámara. Actívalo en los ajustes del navegador y vuelve a intentar.";
    case "NotFoundError":
    case "OverconstrainedError":
      return "No se encontró una cámara en este dispositivo.";
    case "NotReadableError":
      return "La cámara está en uso por otra aplicación. Ciérrala e inténtalo de nuevo.";
    default:
      return "No se pudo iniciar la cámara. Puedes escribir el código a mano.";
  }
}

function buildReader() {
  const hints = new Map();
  hints.set(DecodeHintType.POSSIBLE_FORMATS, SCAN_FORMAT_NAMES.map((name) => BarcodeFormat[name]));
  hints.set(DecodeHintType.TRY_HARDER, true);
  return new BrowserMultiFormatReader(hints, { delayBetweenScanAttempts: 120 });
}

// Lee códigos de barras con la cámara trasera. onDetected(code) puede devolver
// { ok, message } para mostrar el resultado en el propio diálogo; en modo continuo
// el diálogo sigue abierto para escanear varios productos seguidos.
export function BarcodeScannerDialog({ open, onClose, onDetected, continuous, title }) {
  const [videoEl, setVideoEl] = useState(null);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [manual, setManual] = useState("");
  const lastRead = useRef({ code: "", at: 0 });
  // Los callbacks cambian en cada render del padre; la cámara no debe reiniciarse por eso.
  const handlers = useRef({ onDetected, onClose, continuous });
  handlers.current = { onDetected, onClose, continuous };

  const handleCode = (raw) => {
    const code = normalizeBarcode(raw);
    if (!code) return;
    const now = Date.now();
    const samePass = lastRead.current.code === code && now - lastRead.current.at < SAME_PASS_GAP_MS;
    // La última vez que se vio se actualiza siempre: mantenerlo a la vista no lo "repite".
    lastRead.current = { code, at: now };
    if (samePass) return;

    if (navigator.vibrate) navigator.vibrate(60);
    const result = handlers.current.onDetected(code);
    setFeedback(result ? { ...result, code } : { ok: true, message: code, code });
    if (!handlers.current.continuous) handlers.current.onClose();
  };

  useEffect(() => {
    if (!open || !videoEl) return undefined;
    let controls = null;
    let cancelled = false;
    setError("");
    setFeedback(null);
    setStarting(true);

    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      setError(cameraErrorMessage());
      setStarting(false);
      return undefined;
    }

    buildReader()
      .decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } } },
        videoEl,
        (result) => {
          if (result && !cancelled) handleCode(result.getText());
        }
      )
      .then((c) => {
        if (cancelled) {
          c.stop();
        } else {
          controls = c;
          setStarting(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(cameraErrorMessage(err));
          setStarting(false);
        }
      });

    return () => {
      cancelled = true;
      if (controls) controls.stop();
      // Garantiza que la luz de la cámara se apague aunque la librería no suelte el stream.
      const stream = videoEl.srcObject;
      if (stream?.getTracks) stream.getTracks().forEach((track) => track.stop());
      videoEl.srcObject = null;
    };
    // handleCode solo usa refs y setters: no hay nada que reiniciar cuando cambia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, videoEl]);

  const submitManual = (e) => {
    e.preventDefault();
    handleCode(manual);
    setManual("");
  };

  return (
    <Dialog open={open} handler={onClose} size="sm" className="max-h-[95vh] overflow-y-auto">
      <DialogHeader className="flex items-center justify-between">
        <Typography variant="h5" color="blue-gray">
          {title}
        </Typography>
        <button type="button" aria-label="Cerrar escáner" onClick={onClose} className="rounded-lg p-1 hover:bg-blue-gray-50">
          <XMarkIcon className="h-5 w-5" />
        </button>
      </DialogHeader>
      <DialogBody className="space-y-4">
        <div className="relative overflow-hidden rounded-xl bg-black">
          <video
            ref={setVideoEl}
            data-testid="scanner-video"
            className="aspect-[4/3] w-full object-cover"
            playsInline
            muted
          />
          {!error && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="h-1/3 w-4/5 rounded-lg border-2 border-blue-500 shadow-[0_0_0_1px_rgba(255,255,255,0.7)]" />
            </div>
          )}
          {starting && !error && (
            <div className="absolute inset-0 grid place-items-center bg-black/50 text-sm text-white">Iniciando cámara…</div>
          )}
          {error && (
            <div className="absolute inset-0 grid place-items-center bg-black/80 p-6 text-center text-sm text-white">
              {error}
            </div>
          )}
        </div>

        <Typography variant="small" className="text-center text-blue-gray-500">
          Apunta la cámara al código de barras del producto.
        </Typography>

        {feedback && (
          <div
            role="status"
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              feedback.ok ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <form onSubmit={submitManual} className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            aria-label="Código escrito a mano"
            placeholder="¿No lee? Escribe el código"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-blue-gray-200 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
          />
          <Button type="submit" size="sm" color="gray" disabled={!normalizeBarcode(manual)}>
            Usar código
          </Button>
        </form>
      </DialogBody>
    </Dialog>
  );
}

BarcodeScannerDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onDetected: PropTypes.func.isRequired,
  continuous: PropTypes.bool,
  title: PropTypes.string,
};
BarcodeScannerDialog.defaultProps = { continuous: false, title: "Escanear código de barras" };

export default BarcodeScannerDialog;
