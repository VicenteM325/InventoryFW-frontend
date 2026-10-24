import { useState } from "react";
import PropTypes from "prop-types";
import { Button, Spinner } from "@material-tailwind/react";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { downloadBlob, extractErrorMessage } from "@/utils/fileDownload";

const FORMATS = [
  { id: "PDF", label: "PDF", extension: "pdf" },
  { id: "XLSX", label: "Excel", extension: "xlsx" },
];

// Descarga el reporte en PDF o Excel. fetchReport(formato) devuelve el Blob y
// filename(extensión) el nombre del archivo.
export function ExportButtons({ fetchReport, filename, disabled, onError }) {
  const [busy, setBusy] = useState(null);

  const handle = async (format) => {
    setBusy(format.id);
    onError("");
    try {
      const blob = await fetchReport(format.id);
      downloadBlob(blob, filename(format.extension));
    } catch (err) {
      onError(await extractErrorMessage(err, "Error al generar el reporte"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {FORMATS.map((format) => (
        <Button
          key={format.id}
          size="sm"
          variant={format.id === "PDF" ? "filled" : "outlined"}
          color="gray"
          className="flex items-center gap-2"
          disabled={disabled || busy !== null}
          onClick={() => handle(format)}
        >
          {busy === format.id ? <Spinner className="h-3.5 w-3.5" /> : <ArrowDownTrayIcon className="h-4 w-4" />}
          {format.label}
        </Button>
      ))}
    </div>
  );
}

ExportButtons.propTypes = {
  fetchReport: PropTypes.func.isRequired,
  filename: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  onError: PropTypes.func.isRequired,
};
ExportButtons.defaultProps = { disabled: false };

export default ExportButtons;
