# InventoryFW — Frontend

Interfaz web de Multiservicios Wilson: inventario, ventas, alertas de stock, notificaciones, reportes, fotocopia de DPI y fotos tamaño cédula/pasaporte.
React 18 · Vite 4 · Tailwind CSS · Material Tailwind, a partir de la plantilla [Material Tailwind Dashboard React](https://github.com/creativetimofficial/material-tailwind-dashboard-react) de Creative Tim (licencia MIT en `LICENSE`).

Backend: [InventoryFW-backend](https://github.com/VicenteM325/InventoryFW-backend).

## Correr en local

Requiere Node 24 (`.nvmrc`) y el backend corriendo en `localhost:8080` (ver su README).

```bash
cp .env.example .env     # VITE_API_URL=http://localhost:8080
npm ci
npm run dev              # http://localhost:5173
```

## Producción (Netlify)

- `npm run build` toma `VITE_API_URL=/` de `.env.production`: el navegador llama a `/api/...` y `/auth/...` en el mismo dominio de Netlify.
- `public/_redirects` hace de proxy hacia el backend en Railway (así la cookie de sesión es de primera parte y no hay CORS en el navegador) y sirve `index.html` en las rutas del SPA. Solo van al backend `/api/*` y `/auth/login`, `/auth/logout`, `/auth/check-auth` y `/auth/user/details`: `/auth/sign-in` es una página del SPA.
- El proxy de Netlify corta cada petición a los 26 s, contando la subida: por eso las fotos de DPI, cédula y pasaporte se reducen en el navegador a 2560 px antes de subirlas (`src/utils/imageDownscale.js`).
- `public/_headers`: caché permanente para `/assets/*` y cabeceras de seguridad básicas.

## CI/CD

`.github/workflows/ci-cd.yml`:

- **CI** (PRs y push a `develop`/`main`): `npm ci`, `npm run build` y verificación de que `_redirects` apunta a un backend real.
- **Deploy** (push a `main`): publica `dist/` con Netlify CLI (`--prod --no-build`) y comprueba que el SPA responde y que el proxy llega al backend.

En GitHub: environment `production` (solo rama `main`) con los secretos `NETLIFY_AUTH_TOKEN` (token personal de Netlify) y `NETLIFY_SITE_ID` (Project ID del sitio), y la variable de repositorio `FRONTEND_URL`. El sitio de Netlify se crea sin Git conectado: los deploys llegan solo desde GitHub Actions.
