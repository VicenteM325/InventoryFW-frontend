import { useState } from "react";
import { Typography } from "@material-tailwind/react";
import { ArchiveBoxIcon, ChartBarIcon } from "@heroicons/react/24/outline";
import { SalesReport } from "./SalesReport";
import { InventoryReport } from "./InventoryReport";

const TABS = [
  { id: "sales", label: "Ventas", icon: ChartBarIcon },
  { id: "inventory", label: "Inventario", icon: ArchiveBoxIcon },
];

export function Reports() {
  const [tab, setTab] = useState("sales");

  return (
    <div className="mt-12 mb-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Typography variant="h4" color="blue-gray">
            Reportes
          </Typography>
          <Typography variant="small" className="font-normal text-blue-gray-500">
            Analiza tus ventas e inventario y descarga el reporte en PDF o Excel.
          </Typography>
        </div>

        <div role="tablist" className="inline-flex rounded-xl bg-blue-gray-50 p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition-colors ${
                tab === id ? "bg-white text-gray-900 shadow-sm" : "text-blue-gray-500 hover:text-blue-gray-800"
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {tab === "sales" ? <SalesReport /> : <InventoryReport />}
    </div>
  );
}

export default Reports;
