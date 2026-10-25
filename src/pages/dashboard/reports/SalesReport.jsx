import { useEffect, useMemo, useState } from "react";
import { Card, Spinner, Typography } from "@material-tailwind/react";
import Chart from "react-apexcharts";
import {
  BanknotesIcon,
  CubeIcon,
  ReceiptPercentIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/solid";
import { reportService } from "@/services/reportService";
import { presetRanges, validateRange } from "@/utils/dateRanges";
import { formatDate, formatDateTime, formatInt, formatMoney } from "@/utils/format";
import { extractErrorMessage } from "@/utils/fileDownload";
import { KpiCard } from "./components/KpiCard";
import { DateRangeFilter } from "./components/DateRangeFilter";
import { ExportButtons } from "./components/ExportButtons";
import { DataTable } from "./components/DataTable";
import { Panel } from "./components/Panel";
import { dailySalesChart, topProductsChart } from "./chartConfigs";
import { useMaterialTailwindController } from "@/context";

const DEFAULT_RANGE = presetRanges().find((p) => p.id === "30d");

const DETAIL_COLUMNS = [
  { key: "date", header: "Fecha", render: (s) => formatDateTime(s.date) },
  { key: "employee", header: "Empleado", render: (s) => s.employee },
  { key: "customer", header: "Cliente", render: (s) => s.customer },
  {
    key: "products",
    header: "Productos",
    render: (s) => (
      <span className="block max-w-xs truncate xl:max-w-sm" title={s.products}>
        {s.products}
      </span>
    ),
  },
  { key: "units", header: "Unidades", align: "right", render: (s) => formatInt(s.units) },
  {
    key: "total",
    header: "Total",
    align: "right",
    render: (s) => <span className="font-semibold">{formatMoney(s.total)}</span>,
  },
];

function EmployeeRanking({ employees }) {
  const max = Math.max(...employees.map((e) => Number(e.total)), 1);
  if (employees.length === 0) {
    return <p className="py-8 text-center text-sm text-blue-gray-400">Sin ventas en el periodo</p>;
  }
  return (
    <ol className="space-y-4">
      {employees.map((employee, index) => (
        <li key={employee.userName}>
          <div className="mb-1 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-gray-50 text-xs font-bold text-blue-gray-700">
                {index + 1}
              </span>
              <span className="truncate text-sm font-medium text-blue-gray-800" title={employee.name}>
                {employee.name}
              </span>
            </div>
            <span className="shrink-0 text-sm font-semibold text-blue-gray-900">{formatMoney(employee.total)}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-blue-gray-50">
            <div
              className="h-full rounded-full bg-blue-500"
              style={{ width: `${(Number(employee.total) / max) * 100}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-blue-gray-500">{formatInt(employee.transactions)} transacciones</p>
        </li>
      ))}
    </ol>
  );
}

export function SalesReport() {
  const [{ darkMode }] = useMaterialTailwindController();
  const [range, setRange] = useState({ from: DEFAULT_RANGE.from, to: DEFAULT_RANGE.to });
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportError, setExportError] = useState("");

  const rangeError = validateRange(range.from, range.to);

  useEffect(() => {
    if (rangeError) return undefined;
    // Si el usuario cambia el rango antes de que llegue la respuesta anterior, esa
    // respuesta ya no corresponde a lo que se ve y se descarta.
    let ignore = false;
    setLoading(true);
    setError("");
    reportService
      .getSalesSummary(range.from, range.to)
      .then((data) => {
        if (!ignore) setSummary(data);
      })
      .catch(async (err) => {
        if (!ignore) setError(await extractErrorMessage(err, "No se pudo cargar el reporte de ventas"));
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [range.from, range.to, rangeError]);

  const dailyChart = useMemo(() => (summary ? dailySalesChart(summary.byDay, darkMode) : null), [summary, darkMode]);
  const productsChart = useMemo(() => (summary ? topProductsChart(summary.topProducts, darkMode) : null), [summary, darkMode]);

  const current = summary?.current;
  const previousLabel = summary
    ? `vs ${formatDate(summary.previousFrom)} – ${formatDate(summary.previousTo)}`
    : "";

  return (
    <div className="space-y-6">
      <Card className="border border-blue-gray-100 p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <DateRangeFilter
            from={range.from}
            to={range.to}
            error={rangeError}
            onChange={(from, to) => setRange({ from, to })}
          />
          <ExportButtons
            disabled={Boolean(rangeError)}
            fetchReport={(format) => reportService.getSalesReport(range.from, range.to, format)}
            filename={(ext) => `reporte_ventas_${range.from}_${range.to}.${ext}`}
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

      {loading && !summary && (
        <div className="flex h-64 items-center justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      )}

      {summary && (
        <div className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              icon={BanknotesIcon}
              accent="blue"
              label="Total vendido"
              value={formatMoney(current.total)}
              change={summary.totalChangePct}
              footer={previousLabel}
            />
            <KpiCard
              icon={ShoppingCartIcon}
              accent="green"
              label="Transacciones"
              value={formatInt(current.transactions)}
              change={summary.transactionsChangePct}
              footer={previousLabel}
            />
            <KpiCard
              icon={ReceiptPercentIcon}
              accent="amber"
              label="Ticket promedio"
              value={formatMoney(current.averageTicket)}
              change={summary.averageTicketChangePct}
              footer={previousLabel}
            />
            <KpiCard
              icon={CubeIcon}
              accent="gray"
              label="Unidades vendidas"
              value={formatInt(current.units)}
              change={summary.unitsChangePct}
              footer={previousLabel}
            />
          </div>

          {current.transactions === 0 && (
            <Card className="border border-blue-gray-100 bg-blue-gray-50/50 p-4">
              <Typography variant="small" className="text-blue-gray-600">
                No hay ventas entre {formatDate(summary.from)} y {formatDate(summary.to)}. Prueba con otro rango de fechas.
              </Typography>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Panel
              className="lg:col-span-2"
              title="Ventas por día"
              subtitle={`${formatDate(summary.from)} al ${formatDate(summary.to)}`}
            >
              <Chart key={darkMode ? "dark" : "light"} {...dailyChart} />
            </Panel>
            <Panel title="Ventas por empleado" subtitle="Ordenado por monto">
              <EmployeeRanking employees={summary.byEmployee} />
            </Panel>
          </div>

          <Panel title="Productos más vendidos" subtitle="Por unidades vendidas en el periodo">
            {summary.topProducts.length === 0 ? (
              <p className="py-16 text-center text-sm text-blue-gray-400">Sin ventas en el periodo</p>
            ) : (
              <Chart key={darkMode ? "dark" : "light"} {...productsChart} />
            )}
          </Panel>

          <Panel title="Detalle de ventas" subtitle={`${formatInt(summary.sales.length)} en el periodo`}>
            <DataTable
              columns={DETAIL_COLUMNS}
              rows={summary.sales}
              rowKey={(s) => s.id}
              searchText={(s) => `${s.employee} ${s.customer} ${s.products}`}
              searchPlaceholder="Buscar cliente, empleado o producto"
              emptyText="No hay ventas que coincidan"
            />
          </Panel>
        </div>
      )}
    </div>
  );
}

export default SalesReport;
