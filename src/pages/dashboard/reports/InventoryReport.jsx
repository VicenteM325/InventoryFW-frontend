import { useEffect, useMemo, useState } from "react";
import { Card, Spinner, Typography } from "@material-tailwind/react";
import Chart from "react-apexcharts";
import {
  BellAlertIcon,
  CheckCircleIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
} from "@heroicons/react/24/solid";
import { reportService } from "@/services/reportService";
import { formatDateTime, formatInt, formatMoney, formatStatus } from "@/utils/format";
import { extractErrorMessage } from "@/utils/fileDownload";
import { toISODate } from "@/utils/dateRanges";
import { KpiCard } from "./components/KpiCard";
import { ExportButtons } from "./components/ExportButtons";
import { DataTable } from "./components/DataTable";
import { Panel } from "./components/Panel";
import { stockStatusChart } from "./chartConfigs";
import { useMaterialTailwindController } from "@/context";

// Colores con contraste suficiente (texto oscuro sobre fondo claro); el chip "ghost" de
// Material Tailwind deja el texto casi invisible.
const STATUS_STYLES = {
  DISPONIBLE: "bg-green-50 text-green-800 ring-green-200",
  ATENDIDA: "bg-green-50 text-green-800 ring-green-200",
  STOCK_BAJO: "bg-amber-50 text-amber-800 ring-amber-200",
  PENDIENTE: "bg-amber-50 text-amber-800 ring-amber-200",
  AGOTADO: "bg-red-50 text-red-800 ring-red-200",
};

function StatusChip({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${
        STATUS_STYLES[status] || "bg-blue-gray-50 text-blue-gray-800 ring-blue-gray-200"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

const PRODUCT_COLUMNS = [
  { key: "name", header: "Producto", render: (p) => <span className="font-medium">{p.name}</span> },
  { key: "barcode", header: "Código", render: (p) => p.barcode },
  { key: "category", header: "Categoría", render: (p) => p.category },
  { key: "supplier", header: "Proveedor", render: (p) => p.supplier },
  { key: "stock", header: "Stock", align: "right", render: (p) => formatInt(p.stock) },
  { key: "minStock", header: "Mínimo", align: "right", render: (p) => formatInt(p.minStock) },
  { key: "price", header: "Precio", align: "right", render: (p) => formatMoney(p.price) },
  { key: "status", header: "Estado", render: (p) => <StatusChip status={p.status} /> },
];

export function InventoryReport() {
  const [{ darkMode }] = useMaterialTailwindController();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    let ignore = false;
    reportService
      .getInventorySummary()
      .then((data) => {
        if (!ignore) setSummary(data);
      })
      .catch(async (err) => {
        if (!ignore) setError(await extractErrorMessage(err, "No se pudo cargar el reporte de inventario"));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, []);

  const statusChart = useMemo(() => (summary ? stockStatusChart(summary, darkMode) : null), [summary, darkMode]);
  const needsAttention = useMemo(
    () => (summary ? summary.products.filter((p) => p.status !== "DISPONIBLE") : []),
    [summary]
  );
  const share = (part) =>
    summary && summary.totalProducts > 0 ? `${Math.round((part * 100) / summary.totalProducts)}% del inventario` : "";

  return (
    <div className="space-y-6">
      <Card className="border border-blue-gray-100 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Typography variant="small" className="text-blue-gray-600">
            Estado actual del inventario de productos activos.
          </Typography>
          <ExportButtons
            fetchReport={(format) => reportService.getInventoryReport(format)}
            filename={(ext) => `reporte_inventario_${toISODate(new Date())}.${ext}`}
            onError={setExportError}
          />
        </div>
        {exportError && <p className="mt-2 text-xs font-medium text-red-600">{exportError}</p>}
      </Card>

      {error && (
        <Card className="border border-red-100 bg-red-50 p-4">
          <Typography variant="small" color="red">
            {error}
          </Typography>
        </Card>
      )}

      {loading && (
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <KpiCard icon={CubeIcon} accent="blue" label="Productos activos" value={formatInt(summary.totalProducts)} />
            <KpiCard
              icon={CheckCircleIcon}
              accent="green"
              label="Disponibles"
              value={formatInt(summary.available)}
              footer={share(summary.available)}
            />
            <KpiCard
              icon={ExclamationTriangleIcon}
              accent="amber"
              label="Stock bajo"
              value={formatInt(summary.lowStock)}
              footer={share(summary.lowStock)}
            />
            <KpiCard
              icon={XCircleIcon}
              accent="red"
              label="Agotados"
              value={formatInt(summary.outOfStock)}
              footer={share(summary.outOfStock)}
            />
            <KpiCard
              icon={BellAlertIcon}
              accent={summary.pendingAlerts > 0 ? "red" : "green"}
              label="Alertas pendientes"
              value={formatInt(summary.pendingAlerts)}
              footer={summary.pendingAlerts > 0 ? "Requieren reposición" : "Todo en orden"}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Panel title="Estado del stock" subtitle="Distribución de productos">
              {summary.totalProducts === 0 ? (
                <p className="py-16 text-center text-sm text-blue-gray-400">No hay productos activos</p>
              ) : (
                <Chart key={darkMode ? "dark" : "light"} {...statusChart} />
              )}
            </Panel>
            <Panel
              className="lg:col-span-2"
              title="Requieren atención"
              subtitle={`${formatInt(needsAttention.length)} productos con stock bajo o agotados`}
            >
              <DataTable
                columns={PRODUCT_COLUMNS.filter((c) => ["name", "supplier", "stock", "minStock", "status"].includes(c.key))}
                rows={needsAttention}
                rowKey={(p) => p.productId}
                pageSize={6}
                emptyText="Todo el inventario está disponible"
              />
            </Panel>
          </div>

          <Panel title="Todos los productos" subtitle={`${formatInt(summary.products.length)} productos activos`}>
            <DataTable
              columns={PRODUCT_COLUMNS}
              rows={summary.products}
              rowKey={(p) => p.productId}
              searchText={(p) => `${p.name} ${p.barcode} ${p.category} ${p.supplier}`}
              searchPlaceholder="Buscar producto, código o proveedor"
              emptyText="No hay productos que coincidan"
            />
          </Panel>

          <Panel title="Alertas de reposición" subtitle="Más recientes primero">
            <DataTable
              columns={[
                { key: "product", header: "Producto", render: (a) => <span className="font-medium">{a.product}</span> },
                { key: "stock", header: "Stock al generarse", align: "right", render: (a) => formatInt(a.stockAtAlert) },
                { key: "status", header: "Estado", render: (a) => <StatusChip status={a.status} /> },
                { key: "createdAt", header: "Generada", render: (a) => formatDateTime(a.createdAt) },
                { key: "attendedAt", header: "Atendida", render: (a) => formatDateTime(a.attendedAt) },
              ]}
              rows={summary.alerts}
              rowKey={(a) => a.id}
              pageSize={8}
              emptyText="No hay alertas registradas"
            />
          </Panel>
        </>
      )}
    </div>
  );
}

export default InventoryReport;
