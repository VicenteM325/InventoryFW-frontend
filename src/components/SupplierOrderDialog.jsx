import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Input,
  Spinner,
  Typography,
} from "@material-tailwind/react";
import { stockAlertService } from "@/services/stockAlertService";
import { useFeedback } from "@/context/FeedbackContext";
import { digitsOnly } from "@/utils/numberInput";

const PREVIEW_DELAY_MS = 400;

/**
 * Pedido de reposición al proveedor del producto de una alerta: se elige la cantidad, se ve
 * la vista previa exacta del correo y, al confirmar, se envía.
 */
export function SupplierOrderDialog({ alert, onClose, onSent }) {
  const { toast } = useFeedback();
  const [quantity, setQuantity] = useState('');
  const [preview, setPreview] = useState(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);

  // Cada vez que se abre para otra alerta se parte de cero.
  useEffect(() => {
    setQuantity('');
    setPreview(null);
  }, [alert?.stockAlertId]);

  const amount = Number(quantity);
  const validQuantity = Number.isInteger(amount) && amount >= 1 && amount <= 100000;

  useEffect(() => {
    if (!alert || !validQuantity) {
      setPreview(null);
      return undefined;
    }
    let ignore = false;
    setLoadingPreview(true);
    const timer = setTimeout(async () => {
      try {
        const data = await stockAlertService.previewSupplierOrder(alert.stockAlertId, amount);
        if (!ignore) setPreview(data);
      } catch (error) {
        if (!ignore) {
          setPreview(null);
          toast.error(error.response?.data?.message || 'No se pudo generar la vista previa');
        }
      } finally {
        if (!ignore) setLoadingPreview(false);
      }
    }, PREVIEW_DELAY_MS);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [alert, amount, validQuantity, toast]);

  const handleSend = async () => {
    setSending(true);
    try {
      const updated = await stockAlertService.sendSupplierOrder(alert.stockAlertId, amount);
      toast.success(`Pedido de ${amount} unidades enviado a ${alert.supplierName}`);
      onSent(updated);
    } catch (error) {
      toast.error(error.response?.data?.message || 'No se pudo enviar el pedido');
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={Boolean(alert)} handler={onClose} size="lg" className="z-[10001]">
      <DialogHeader className="flex-col items-start gap-1">
        <span className="text-lg">Pedir al proveedor</span>
        <Typography variant="small" className="font-normal text-blue-gray-600">
          {alert?.productName} · Proveedor: {alert?.supplierName} ({alert?.supplierEmail})
        </Typography>
      </DialogHeader>
      <DialogBody className="max-h-[70vh] space-y-4 overflow-y-auto">
        {alert?.orderedAt && (
          <Typography variant="small" className="rounded-lg bg-amber-50 p-3 font-normal text-amber-800">
            Ya enviaste un pedido de {alert.orderedQuantity} unidades el{' '}
            {new Date(alert.orderedAt).toLocaleString()}. Si envías otro, el proveedor recibirá ambos.
          </Typography>
        )}
        <Typography variant="small" className="font-normal text-blue-gray-600">
          Stock actual: {alert?.stockAtAlert} · Mínimo: {alert?.minStock}
        </Typography>
        <div className="max-w-xs">
          <Input
            label="Cantidad a pedir"
            inputMode="numeric"
            value={quantity}
            onChange={(e) => setQuantity(digitsOnly(e.target.value))}
            autoFocus
          />
        </div>

        <div>
          <Typography variant="small" color="blue-gray" className="mb-2 font-bold">
            Vista previa del correo
          </Typography>
          {!validQuantity ? (
            <Typography variant="small" className="rounded-lg border border-dashed border-blue-gray-100 p-6 text-center font-normal text-blue-gray-500">
              Escribe la cantidad (de 1 a 100000) para ver el correo que recibirá el proveedor.
            </Typography>
          ) : loadingPreview && !preview ? (
            <div className="flex justify-center p-6">
              <Spinner className="h-6 w-6" />
            </div>
          ) : preview ? (
            <div className="overflow-hidden rounded-lg border border-blue-gray-100">
              <div className="space-y-1 border-b border-blue-gray-100 p-3 text-sm">
                <p><span className="text-blue-gray-500">Para:</span> {preview.to}</p>
                <p><span className="text-blue-gray-500">Asunto:</span> {preview.subject}</p>
              </div>
              <iframe
                title="Vista previa del correo"
                sandbox=""
                srcDoc={preview.html}
                className="h-96 w-full bg-white"
              />
            </div>
          ) : null}
        </div>
      </DialogBody>
      <DialogFooter className="gap-2">
        <Button variant="text" color="blue-gray" onClick={onClose} disabled={sending}>
          Cancelar
        </Button>
        <Button color="green" onClick={handleSend} disabled={!validQuantity || !preview || sending}>
          {sending ? 'Enviando...' : 'Enviar pedido'}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

SupplierOrderDialog.propTypes = {
  alert: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onSent: PropTypes.func.isRequired,
};

export default SupplierOrderDialog;
