import { useState } from "react";
import PropTypes from "prop-types";
import { Button, IconButton, Tooltip } from "@material-tailwind/react";
import { QrCodeIcon } from "@heroicons/react/24/outline";
import { BarcodeScannerDialog } from "./BarcodeScannerDialog";

// Botón que abre el escáner de la cámara. Con label muestra un botón con texto;
// sin label, un botón de icono (para ponerlo junto a un campo).
export function ScanButton({ onDetected, continuous, label, title, className }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {label ? (
        <Button
          type="button"
          size="sm"
          variant="outlined"
          color="gray"
          className={`flex items-center gap-2 ${className}`}
          onClick={() => setOpen(true)}
        >
          <QrCodeIcon className="h-4 w-4" />
          {label}
        </Button>
      ) : (
        <Tooltip content="Escanear con la cámara">
          <IconButton
            type="button"
            variant="outlined"
            color="gray"
            aria-label="Escanear código con la cámara"
            className={className}
            onClick={() => setOpen(true)}
          >
            <QrCodeIcon className="h-5 w-5" />
          </IconButton>
        </Tooltip>
      )}
      <BarcodeScannerDialog
        open={open}
        onClose={() => setOpen(false)}
        onDetected={onDetected}
        continuous={continuous}
        title={title}
      />
    </>
  );
}

ScanButton.propTypes = {
  onDetected: PropTypes.func.isRequired,
  continuous: PropTypes.bool,
  label: PropTypes.string,
  title: PropTypes.string,
  className: PropTypes.string,
};
ScanButton.defaultProps = { continuous: false, label: null, title: undefined, className: "" };

export default ScanButton;
