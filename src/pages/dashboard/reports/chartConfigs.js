import { formatInt, formatMoney, formatShortDate } from "@/utils/format";

const INK = "#1F2937";
const BLUE = "#2563EB";
const FONT = "Roboto, sans-serif";

const baseChart = {
  toolbar: { show: false },
  fontFamily: FONT,
  animations: { enabled: true, speed: 350 },
};

const baseGrid = {
  borderColor: "#E5E7EB",
  strokeDashArray: 4,
  padding: { left: 8, right: 8 },
};

// Q1.2k, Q15k: etiquetas del eje Y sin ocupar ancho.
export function compactMoney(value) {
  const n = Number(value) || 0;
  if (n >= 1_000_000) return `Q${+(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Q${+(n / 1_000).toFixed(1)}k`;
  return `Q${Math.round(n)}`;
}

export function truncate(text, max) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

// Ventas por día: columnas; con rangos largos se muestran menos etiquetas para que no se amontonen.
export function dailySalesChart(byDay) {
  return {
    type: "bar",
    height: 300,
    series: [{ name: "Ventas", data: byDay.map((d) => Number(d.total)) }],
    options: {
      chart: baseChart,
      colors: [BLUE],
      plotOptions: { bar: { borderRadius: 4, columnWidth: byDay.length > 20 ? "70%" : "55%" } },
      dataLabels: { enabled: false },
      grid: baseGrid,
      xaxis: {
        categories: byDay.map((d) => formatShortDate(d.date)),
        tickAmount: Math.min(byDay.length, 12),
        labels: { rotate: 0, hideOverlappingLabels: true, style: { colors: "#6B7280", fontSize: "11px" } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: { formatter: compactMoney, style: { colors: "#6B7280", fontSize: "11px" } },
      },
      tooltip: {
        y: { formatter: (value) => formatMoney(value) },
        x: { formatter: (_, { dataPointIndex }) => `${byDay[dataPointIndex].transactions} transacciones` },
      },
    },
  };
}

// Productos más vendidos: barras horizontales por unidades.
export function topProductsChart(topProducts) {
  const top = topProducts.slice(0, 8);
  return {
    type: "bar",
    height: Math.max(240, top.length * 38 + 40),
    series: [{ name: "Unidades", data: top.map((p) => p.units) }],
    options: {
      chart: baseChart,
      colors: [INK],
      plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "62%" } },
      dataLabels: {
        enabled: true,
        formatter: (v) => formatInt(v),
        style: { fontSize: "11px", colors: ["#fff"] },
      },
      grid: { ...baseGrid, xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
      xaxis: {
        categories: top.map((p) => truncate(p.name, 24)),
        labels: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { colors: "#374151", fontSize: "12px" }, maxWidth: 160 } },
      tooltip: {
        y: {
          formatter: (units, { dataPointIndex }) =>
            `${formatInt(units)} u. · ${formatMoney(top[dataPointIndex].revenue)}`,
        },
      },
    },
  };
}

// Distribución del inventario por estado de stock.
export function stockStatusChart({ available, lowStock, outOfStock }) {
  return {
    type: "donut",
    height: 280,
    series: [available, lowStock, outOfStock],
    options: {
      chart: { fontFamily: FONT },
      labels: ["Disponibles", "Stock bajo", "Agotados"],
      colors: ["#16A34A", "#D97706", "#DC2626"],
      dataLabels: { enabled: false },
      legend: { position: "bottom", fontSize: "12px", markers: { radius: 12 } },
      stroke: { width: 2 },
      plotOptions: {
        pie: {
          donut: {
            size: "68%",
            labels: {
              show: true,
              total: { show: true, label: "Productos", fontSize: "12px", color: "#6B7280" },
              value: { fontSize: "24px", fontWeight: 700, color: INK },
            },
          },
        },
      },
      tooltip: { y: { formatter: (v) => `${formatInt(v)} productos` } },
    },
  };
}
