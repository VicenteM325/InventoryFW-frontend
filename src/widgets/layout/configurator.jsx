import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { IconButton, Typography } from "@material-tailwind/react";
import {
  useMaterialTailwindController,
  setOpenConfigurator,
  setSidenavColor,
  setSidenavType,
} from "@/context";

const SIDENAV_COLORS = [
  { value: "dark", label: "Negro", swatch: "from-gray-800 to-black" },
  { value: "white", label: "Gris", swatch: "from-gray-100 to-gray-300" },
  { value: "green", label: "Verde", swatch: "from-green-400 to-green-600" },
  { value: "orange", label: "Naranja", swatch: "from-orange-400 to-orange-600" },
  { value: "red", label: "Rojo", swatch: "from-red-400 to-red-600" },
  { value: "pink", label: "Rosa", swatch: "from-pink-400 to-pink-600" },
];

const SIDENAV_TYPES = [
  { value: "white", label: "Claro", preview: "bg-white border-blue-gray-100" },
  { value: "dark", label: "Oscuro", preview: "bg-gradient-to-br from-gray-800 to-gray-900 border-gray-900" },
  { value: "transparent", label: "Transparente", preview: "bg-transparent border-dashed border-blue-gray-300" },
];

export function Configurator() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { openConfigurator, sidenavColor, sidenavType } = controller;
  const close = () => setOpenConfigurator(dispatch, false);

  return (
    <>
      <div
        aria-hidden="true"
        onClick={close}
        className={`fixed inset-0 z-[55] bg-black/30 transition-opacity duration-300 ${
          openConfigurator ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        aria-label="Configuración del panel"
        className={`fixed right-0 top-0 z-[60] h-screen w-full max-w-sm overflow-y-auto bg-white px-4 shadow-xl transition-transform duration-300 ${
          openConfigurator ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between px-2 pb-4 pt-8">
          <div>
            <Typography variant="h5" color="blue-gray">
              Configuración del panel
            </Typography>
            <Typography variant="small" className="font-normal text-blue-gray-600">
              Personaliza el aspecto del menú lateral.
            </Typography>
          </div>
          <IconButton variant="text" color="blue-gray" aria-label="Cerrar configuración" onClick={close}>
            <XMarkIcon strokeWidth={2.5} className="h-5 w-5" />
          </IconButton>
        </div>

        <div className="border-t border-blue-gray-50 px-2 py-6">
          <Typography variant="h6" color="blue-gray">
            Color del menú
          </Typography>
          <Typography variant="small" className="font-normal text-blue-gray-600">
            Color de la opción seleccionada.
          </Typography>
          <div className="mt-4 flex flex-wrap gap-3">
            {SIDENAV_COLORS.map(({ value, label, swatch }) => {
              const active = sidenavColor === value;
              return (
                <button
                  key={value}
                  type="button"
                  title={label}
                  aria-label={label}
                  aria-pressed={active}
                  onClick={() => setSidenavColor(dispatch, value)}
                  className={`grid h-10 w-10 place-items-center rounded-full border border-blue-gray-100 bg-gradient-to-br transition hover:scale-105 ${swatch} ${
                    active ? "ring-2 ring-blue-gray-900 ring-offset-2" : ""
                  }`}
                >
                  {active && (
                    <CheckIcon
                      strokeWidth={3}
                      className={`h-5 w-5 ${value === "white" ? "text-blue-gray-800" : "text-white"}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-blue-gray-50 px-2 py-6">
          <Typography variant="h6" color="blue-gray">
            Tipo de menú
          </Typography>
          <Typography variant="small" className="font-normal text-blue-gray-600">
            Fondo del menú lateral.
          </Typography>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {SIDENAV_TYPES.map(({ value, label, preview }) => {
              const active = sidenavType === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setSidenavType(dispatch, value)}
                  className={`rounded-xl border p-2 text-center transition hover:border-blue-gray-400 ${
                    active ? "border-blue-gray-900 ring-1 ring-blue-gray-900" : "border-blue-gray-100"
                  }`}
                >
                  <span className={`mb-2 block h-12 rounded-lg border ${preview}`} />
                  <Typography variant="small" color="blue-gray" className={active ? "font-bold" : "font-medium"}>
                    {label}
                  </Typography>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}

Configurator.displayName = "/src/widgets/layout/configurator.jsx";

export default Configurator;
