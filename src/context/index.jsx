import React from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";

const DARK_MODE_KEY = "inventoryfw-dark-mode";

// La clave guarda "dark" o "light"; sin preferencia guardada se usa la del sistema.
function readInitialDarkMode() {
  try {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    if (saved === "dark" || saved === "light") return saved === "dark";
  } catch {
    // localStorage no disponible (modo privado, etc.): se usa la preferencia del sistema.
  }
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;
}

export const MaterialTailwind = React.createContext(null);
MaterialTailwind.displayName = "MaterialTailwindContext";

export function reducer(state, action) {
  switch (action.type) {
    case "OPEN_SIDENAV": {
      return { ...state, openSidenav: action.value };
    }
    case "SIDENAV_TYPE": {
      return { ...state, sidenavType: action.value };
    }
    case "SIDENAV_COLOR": {
      return { ...state, sidenavColor: action.value };
    }
    case "TRANSPARENT_NAVBAR": {
      return { ...state, transparentNavbar: action.value };
    }
    case "FIXED_NAVBAR": {
      return { ...state, fixedNavbar: action.value };
    }
    case "DARK_MODE": {
      return { ...state, darkMode: action.value };
    }
    case "OPEN_CONFIGURATOR": {
      return { ...state, openConfigurator: action.value };
    }
    default: {
      throw new Error(`Unhandled action type: ${action.type}`);
    }
  }
}

export function MaterialTailwindControllerProvider({ children }) {
  const createInitialState = () => ({
    openSidenav: false,
    sidenavColor: "dark",
    sidenavType: "white",
    transparentNavbar: true,
    fixedNavbar: false,
    openConfigurator: false,
    darkMode: readInitialDarkMode(),
  });

  const [controller, dispatch] = React.useReducer(reducer, undefined, createInitialState);
  const { pathname } = useLocation();

  // La clase "dark" activa la paleta oscura (css/tailwind.css). La landing pública no participa.
  React.useEffect(() => {
    const active = controller.darkMode && pathname !== "/";
    document.documentElement.classList.toggle("dark", active);
  }, [controller.darkMode, pathname]);

  React.useEffect(() => {
    try {
      localStorage.setItem(DARK_MODE_KEY, controller.darkMode ? "dark" : "light");
    } catch {
      // Sin almacenamiento: la preferencia vale solo para esta sesión.
    }
  }, [controller.darkMode]);
  const value = React.useMemo(
    () => [controller, dispatch],
    [controller, dispatch]
  );

  return (
    <MaterialTailwind.Provider value={value}>
      {children}
    </MaterialTailwind.Provider>
  );
}

export function useMaterialTailwindController() {
  const context = React.useContext(MaterialTailwind);

  if (!context) {
    throw new Error(
      "useMaterialTailwindController should be used inside the MaterialTailwindControllerProvider."
    );
  }

  return context;
}

MaterialTailwindControllerProvider.displayName = "/src/context/index.jsx";

MaterialTailwindControllerProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const setOpenSidenav = (dispatch, value) =>
  dispatch({ type: "OPEN_SIDENAV", value });
export const setSidenavType = (dispatch, value) =>
  dispatch({ type: "SIDENAV_TYPE", value });
export const setSidenavColor = (dispatch, value) =>
  dispatch({ type: "SIDENAV_COLOR", value });
export const setTransparentNavbar = (dispatch, value) =>
  dispatch({ type: "TRANSPARENT_NAVBAR", value });
export const setFixedNavbar = (dispatch, value) =>
  dispatch({ type: "FIXED_NAVBAR", value });
export const setDarkMode = (dispatch, value) =>
  dispatch({ type: "DARK_MODE", value });
export const setOpenConfigurator = (dispatch, value) =>
  dispatch({ type: "OPEN_CONFIGURATOR", value });
