import { useEffect } from "react";
import PropTypes from "prop-types";
import { Link, NavLink } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  Avatar,
  Button,
  IconButton,
  Typography,
} from "@material-tailwind/react";
import { useMaterialTailwindController, setOpenSidenav } from "@/context";
import useAuth from "@/hooks/useAuth";
import { filterRoutesForNavigation } from "@/auth/menuByRole";

export function Sidenav({ brandImg, brandName, routes }) {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavColor, sidenavType, openSidenav } = controller;
  const { roles } = useAuth();
  const visibleRoutes = filterRoutesForNavigation(routes, roles);
  const sidenavTypes = {
    dark: "bg-gradient-to-br from-gray-800 to-gray-900",
    white: "bg-white shadow-sm",
    transparent: "bg-transparent",
  };

  const closeSidenav = () => setOpenSidenav(dispatch, false);

  // Escape cierra el menú mientras está abierto (relevante en móvil, donde es un cajón).
  useEffect(() => {
    if (!openSidenav) return undefined;
    const onKeyDown = (e) => e.key === "Escape" && setOpenSidenav(dispatch, false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openSidenav, dispatch]);

  return (
    <>
    <div
      aria-hidden="true"
      onClick={closeSidenav}
      className={`fixed inset-0 z-[45] bg-black/40 transition-opacity duration-300 xl:hidden ${
        openSidenav ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    />
    <aside
      className={`${sidenavTypes[sidenavType]} ${
        openSidenav ? "translate-x-0" : "-translate-x-80"
      } fixed inset-0 z-50 my-4 ml-4 h-[calc(100vh-32px)] w-72 rounded-xl transition-transform duration-300 xl:translate-x-0 border border-blue-gray-100`}
    >
      <div className={`relative`}>
        <Link to="/" className="block py-6 pl-8 pr-14 text-center" onClick={closeSidenav}>
          <Typography
            variant="h6"
            color={sidenavType === "dark" ? "white" : "blue-gray"}
          >
            {brandName}
          </Typography>
        </Link>
        <IconButton
          variant="text"
          color={sidenavType === "dark" ? "white" : "blue-gray"}
          aria-label="Cerrar menú"
          className="!absolute right-2 top-2 grid h-11 w-11 xl:hidden"
          onClick={closeSidenav}
        >
          <XMarkIcon
            strokeWidth={2.5}
            className={`h-6 w-6 ${sidenavType === "dark" ? "text-white" : "text-blue-gray-700"}`}
          />
        </IconButton>
      </div>
      <div className="m-4">
        {visibleRoutes
          .filter(route => route.layout === "dashboard")
          .map(({ layout, title, pages }, key) => (
            <ul key={key} className="mb-4 flex flex-col gap-1">
              {title && (
                <li className="mx-3.5 mt-4 mb-2">
                  <Typography
                    variant="small"
                    color={sidenavType === "dark" ? "white" : "blue-gray"}
                    className="font-black uppercase opacity-75"
                  >
                    {title}
                  </Typography>
                </li>
              )}
              {pages
                .filter(page => !page.hidden) 
                .map(({ icon, name, path }) => (
                  <li key={name}>
                    <NavLink to={`/${layout}${path}`} onClick={closeSidenav}>
                      {({ isActive }) => (
                        <Button
                          variant={isActive ? "gradient" : "text"}
                          color={
                            isActive
                              ? sidenavColor
                              : sidenavType === "dark"
                              ? "white"
                              : "blue-gray"
                          }
                          className="flex items-center gap-4 px-4 capitalize"
                          fullWidth
                        >
                          {icon}
                          <Typography
                            color="inherit"
                            className="font-medium capitalize"
                          >
                            {name}
                          </Typography>
                        </Button>
                      )}
                    </NavLink>
                  </li>
                ))}
            </ul>
          ))}
      </div>
    </aside>
    </>
  );
}

Sidenav.defaultProps = {
  brandImg: "/img/logo-ct.png",
  brandName: "Multiservicios Wilson",
};

Sidenav.propTypes = {
  brandImg: PropTypes.string,
  brandName: PropTypes.string,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

Sidenav.displayName = "/src/widgets/layout/sidnave.jsx";

export default Sidenav;