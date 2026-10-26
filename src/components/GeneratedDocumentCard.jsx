import { Button, Card, Typography } from "@material-tailwind/react";
import { downloadBlob, printBlob } from "@/utils/fileDownload";

/**
 * Resultado de una generación: `result` es { blob, filename, format }. El
 * botón de imprimir solo aparece para PDF, que el navegador puede abrir.
 * `hint` es una nota opcional bajo los botones (p.ej. cómo imprimir).
 */
export function GeneratedDocumentCard({ result, hint }) {
  const isPdf = result.format === 'PDF';

  return (
    <Card className="mt-6 p-6">
      <Typography variant="h6" color="blue-gray" className="mb-4">
        Documento generado
      </Typography>
      <div className="flex flex-wrap gap-4">
        <Button color="green" onClick={() => downloadBlob(result.blob, result.filename)}>
          Descargar {isPdf ? 'PDF' : 'Word'}
        </Button>
        {isPdf && (
          <Button variant="outlined" color="blue-gray" onClick={() => printBlob(result.blob)}>
            Imprimir
          </Button>
        )}
      </div>
      {hint && (
        <Typography variant="small" color="gray" className="mt-3">
          {hint}
        </Typography>
      )}
    </Card>
  );
}

export default GeneratedDocumentCard;
