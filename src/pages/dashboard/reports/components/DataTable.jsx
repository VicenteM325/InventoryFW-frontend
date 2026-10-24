import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Typography } from "@material-tailwind/react";
import { ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

// Tabla con búsqueda y paginación en el cliente. columns: [{ key, header, align, render(row) }].
// searchText(row) devuelve el texto contra el que se filtra.
export function DataTable({ columns, rows, rowKey, searchText, pageSize, emptyText, searchPlaceholder }) {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((row) => searchText(row).toLowerCase().includes(q)) : rows;
  }, [rows, query, searchText]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * pageSize, current * pageSize + pageSize);
  const from = filtered.length === 0 ? 0 : current * pageSize + 1;
  const to = Math.min(filtered.length, (current + 1) * pageSize);

  return (
    <div>
      {searchText && (
        <div className="relative mb-3 max-w-xs">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blue-gray-400" />
          <input
            type="search"
            aria-label="Buscar"
            placeholder={searchPlaceholder}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
            className="w-full rounded-lg border border-blue-gray-200 bg-white py-1.5 pl-9 pr-3 text-sm focus:border-gray-900 focus:outline-none"
          />
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-blue-gray-100">
        <table className="w-full min-w-max table-auto text-left">
          <thead>
            <tr className="bg-blue-gray-50/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide text-blue-gray-600 ${
                    col.align === "right" ? "text-right" : ""
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-10 text-center text-sm text-blue-gray-400">
                  {emptyText}
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={rowKey(row)} className="border-t border-blue-gray-50 hover:bg-blue-gray-50/40">
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-2.5 text-sm text-blue-gray-800 ${col.align === "right" ? "text-right" : ""}`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <div className="mt-3 flex items-center justify-between">
          <Typography variant="small" className="text-blue-gray-500">
            {from}–{to} de {filtered.length}
          </Typography>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Página anterior"
              disabled={current === 0}
              onClick={() => setPage(current - 1)}
              className="rounded-lg border border-blue-gray-100 p-1.5 text-blue-gray-600 hover:bg-blue-gray-50 disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs text-blue-gray-600">
              {current + 1} / {pages}
            </span>
            <button
              type="button"
              aria-label="Página siguiente"
              disabled={current >= pages - 1}
              onClick={() => setPage(current + 1)}
              className="rounded-lg border border-blue-gray-100 p-1.5 text-blue-gray-600 hover:bg-blue-gray-50 disabled:opacity-40"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

DataTable.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      header: PropTypes.string.isRequired,
      align: PropTypes.string,
      render: PropTypes.func.isRequired,
    })
  ).isRequired,
  rows: PropTypes.array.isRequired,
  rowKey: PropTypes.func.isRequired,
  searchText: PropTypes.func,
  pageSize: PropTypes.number,
  emptyText: PropTypes.string,
  searchPlaceholder: PropTypes.string,
};
DataTable.defaultProps = {
  searchText: null,
  pageSize: 10,
  emptyText: "Sin datos para mostrar",
  searchPlaceholder: "Buscar...",
};

export default DataTable;
