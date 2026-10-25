import { formatInt, formatMoney, formatShortDate } from "@/utils/format";

const FONT = "Roboto, sans-serif";

// Colores de las gráficas según el modo (claro u oscuro).
function palette(dark) {
  return dark
    ? { ink: "#E5E5E5", blue: "#60A5FA", bar: "#9E9E9E", axis: "#A3A3A3", axisStrong: "#D4D4D4", grid: "#424242" }
    : { ink: "#1F2937", blue: "#2563EB", bar: "#1F2937", axis: "#6B7280", axisStrong: "#374151", grid: "#E5E7EB" };
}

const themed = (dark, extra = {}) => ({
  ...extra,
  background: "transparent",
  foreColor: palette(dark).axis,
  toolbar: { show: false },
  fontFamily: FONT,
  animations: { enabled: true, speed: 350 },
});

const gridFor = (dark) => ({
  borderColor: palette(dark).grid,
  strokeDashArray: 4,
  padding: { left: 8, right: 8 },
});

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
export function dailySalesChart(byDay, dark = false) {
  const c = palette(dark);
  return {
    type: "bar",
    height: 300,
    series: [{ name: "Ventas", data: byDay.map((d) => Number(d.total)) }],
    options: {
      chart: themed(dark),
      theme: { mode: dark ? "dark" : "light" },
      colors: [c.blue],
      plotOptions: { bar: { borderRadius: 4, columnWidth: byDay.length > 20 ? "70%" : "55%" } },
      dataLabels: { enabled: false },
      grid: gridFor(dark),
      xaxis: {
        categories: byDay.map((d) => formatShortDate(d.date)),
        tickAmount: Math.min(byDay.length, 12),
        labels: { rotate: 0, hideOverlappingLabels: true, style: { colors: c.axis, fontSize: "11px" } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: { formatter: compactMoney, style: { colors: c.axis, fontSize: "11px" } },
      },
      tooltip: {
        theme: dark ? "dark" : "light",
        y: { formatter: (value) => formatMoney(value) },
        x: { formatter: (_, { dataPointIndex }) => `${byDay[dataPointIndex].transactions} transacciones` },
      },
    },
  };
}

// Productos más vendidos: barras horizontales por unidades.
export function topProductsChart(topProducts, dark = false) {
  const c = palette(dark);
  const top = topProducts.slice(0, 8);
  return {
    type: "bar",
    height: Math.max(220, top.length * 40 + 30),
    series: [{ name: "Unidades", data: top.map((p) => p.units) }],
    options: {
      chart: themed(dark),
      theme: { mode: dark ? "dark" : "light" },
      colors: [c.bar],
      plotOptions: { bar: { horizontal: true, borderRadius: 4, barHeight: "62%" } },
      dataLabels: {
        enabled: true,
        formatter: (v) => formatInt(v),
        style: { fontSize: "11px", colors: ["#fff"] },
      },
      grid: { ...gridFor(dark), xaxis: { lines: { show: true } }, yaxis: { lines: { show: false } } },
      xaxis: {
        categories: top.map((p) => truncate(p.name, 42)),
        labels: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { colors: c.axisStrong, fontSize: "12px" }, maxWidth: 260 } },
      tooltip: {
        theme: dark ? "dark" : "light",
        y: {
          formatter: (units, { dataPointIndex }) =>
            `${formatInt(units)} u. · ${formatMoney(top[dataPointIndex].revenue)}`,
        },
      },
    },
  };
}

// Distribución del inventario por estado de stock.
export function stockStatusChart({ available, lowStock, outOfStock }, dark = false) {
  const c = palette(dark);
  return {
    type: "donut",
    height: 280,
    series: [available, lowStock, outOfStock],
    options: {
      chart: { fontFamily: FONT, background: "transparent", foreColor: c.axis },
      theme: { mode: dark ? "dark" : "light" },
      labels: ["Disponibles", "Stock bajo", "Agotados"],
      colors: ["#16A34A", "#D97706", "#DC2626"],
      dataLabels: { enabled: false },
      legend: { position: "bottom", fontSize: "12px", markers: { radius: 12 } },
      stroke: { width: 2, colors: [dark ? "#2b2b2b" : "#fff"] },
      plotOptions: {
        pie: {
          donut: {
            size: "68%",
            labels: {
              show: true,
              total: { show: true, label: "Productos", fontSize: "12px", color: c.axis },
              value: { fontSize: "24px", fontWeight: 700, color: c.ink },
            },
          },
        },
      },
      tooltip: { theme: dark ? "dark" : "light", y: { formatter: (v) => `${formatInt(v)} productos` } },
    },
  };
}
