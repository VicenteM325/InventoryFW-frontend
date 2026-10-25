import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import {
  Button,
  Dialog,
  DialogBody,
  DialogFooter,
  DialogHeader,
  Typography,
} from "@material-tailwind/react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";

const FeedbackContext = createContext(null);

const TOAST_MS = 4500;

const TOAST_STYLES = {
  success: { icon: CheckCircleIcon, className: "border-green-500 text-green-800" },
  error: { icon: ExclamationTriangleIcon, className: "border-red-500 text-red-800" },
  info: { icon: InformationCircleIcon, className: "border-blue-500 text-blue-800" },
};

/**
 * Reemplaza window.alert / window.confirm: `toast.success|error|info(mensaje)` muestra un aviso
 * que se cierra solo y `confirm({ title, message, ... })` devuelve una promesa con true/false.
 */
export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const nextId = useRef(0);
  const resolver = useRef(null);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = nextId.current++;
      setToasts((current) => [...current, { id, type, message }]);
      setTimeout(() => dismiss(id), TOAST_MS);
    },
    [dismiss]
  );

  const toast = useMemo(
    () => ({
      success: (message) => push("success", message),
      error: (message) => push("error", message),
      info: (message) => push("info", message),
    }),
    [push]
  );

  const confirm = useCallback(
    (options) =>
      new Promise((resolve) => {
        resolver.current = resolve;
        setDialog(options);
      }),
    []
  );

  const settle = (result) => {
    resolver.current?.(result);
    resolver.current = null;
    setDialog(null);
  };

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      <div
        className="pointer-events-none fixed inset-x-4 top-4 z-[10000] flex flex-col items-end gap-2 sm:left-auto sm:w-96"
        aria-live="polite"
      >
        {toasts.map(({ id, type, message }) => {
          const { icon: Icon, className } = TOAST_STYLES[type];
          return (
            <div
              key={id}
              role={type === "error" ? "alert" : "status"}
              className={`pointer-events-auto flex w-full items-start gap-3 rounded-lg border-l-4 bg-white p-3 shadow-lg ${className}`}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <Typography variant="small" className="flex-1 font-medium text-blue-gray-800">
                {message}
              </Typography>
              <button
                type="button"
                aria-label="Cerrar aviso"
                className="text-blue-gray-400 hover:text-blue-gray-700"
                onClick={() => dismiss(id)}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      <Dialog open={Boolean(dialog)} handler={() => settle(false)} size="xs" className="z-[10001]">
        <DialogHeader className="text-lg">{dialog?.title ?? "Confirmar"}</DialogHeader>
        <DialogBody>
          <Typography className="font-normal text-blue-gray-600">{dialog?.message}</Typography>
        </DialogBody>
        <DialogFooter className="gap-2">
          <Button variant="text" color="blue-gray" onClick={() => settle(false)}>
            {dialog?.cancelText ?? "Cancelar"}
          </Button>
          <Button color={dialog?.danger ? "red" : "blue"} onClick={() => settle(true)}>
            {dialog?.confirmText ?? "Confirmar"}
          </Button>
        </DialogFooter>
      </Dialog>
    </FeedbackContext.Provider>
  );
}

FeedbackProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useFeedback() {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    throw new Error("useFeedback debe usarse dentro de <FeedbackProvider>");
  }
  return ctx;
}
