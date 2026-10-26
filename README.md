# InventoryFW — Frontend

Interfaz web de **Multiservicios Wilson**, un negocio de ventas y servicios. Sirve para llevar el inventario y las ventas del día, enterarse cuando un producto se está acabando y pedirlo al proveedor, sacar reportes, y preparar los trámites del mostrador: la fotocopia de DPI y las fotos tamaño cédula y pasaporte listas para imprimir.

Es una aplicación de una sola página (SPA) que consume la API del [backend](https://github.com/VicenteM325/InventoryFW-backend). Incluye inicio de sesión con verificación en dos pasos por correo y recuperación de contraseña.

Manual de usuario: [Scribe](https://scribehow.com/o/YKnGuif3TM2hFmaEspMEdQ/viewer/Managing_Inventory_and_Sales_at_Multiservicios_Wilson__UzU__U-NQQiRFGiAnrS06w).

## Tecnologías

| Pieza | Versión | Para qué se usa |
|---|---|---|
| React | 18 | Interfaz |
| Vite | 4 | Servidor de desarrollo y compilación |
| React Router | 6 | Rutas, con protección por sesión y por rol |
| Tailwind CSS + Material Tailwind | 3.3 / 2.1 | Estilos y componentes. Parte de la plantilla [Material Tailwind Dashboard React](https://github.com/creativetimofficial/material-tailwind-dashboard-react) de Creative Tim (licencia MIT en `LICENSE`) |
| Axios | 1.x | Llamadas a la API, siempre con la cookie de sesión |
| ApexCharts | 3.44 | Gráficas del dashboard y de los reportes |
| ZXing | 0.21 | Lectura de códigos de barras con la cámara |
| Vitest | 0.34 | Pruebas unitarias |

## Qué hace cada pantalla

Hay dos roles: **Administrador** y **Encargado**. El menú solo muestra lo que el rol puede usar, y si alguien entra a mano a una ruta sin permiso se le devuelve a su pantalla de inicio.

| Pantalla | Ruta | Quién | Qué hace |
|---|---|---|---|
| Landing | `/` | Público | Información del negocio y botón para iniciar sesión |
| Iniciar sesión | `/auth/sign-in` | Público | Usuario y contraseña; si la cuenta tiene segundo factor, pide el código que llega por correo |
| Olvidé mi contraseña / Restablecer | `/auth/forgot`, `/auth/reset` | Público | Envía un enlace por correo y permite fijar una contraseña nueva |
| Dashboard | `/dashboard/home` | Administrador | Resumen del negocio, alertas de stock recientes y ventas recientes |
| Productos | `/dashboard/products` | Ambos | Listado, búsqueda, alta, edición, baja y reactivación. Se puede escanear el código de barras |
| Proveedores | `/dashboard/suppliers` | Ambos | Alta, edición y eliminación (esta última solo el Administrador) |
| Ventas | `/dashboard/sales` | Ambos | Registra una venta con varios productos (escaneando o buscando), valida el stock disponible y muestra las ventas recientes |
| Alertas | `/dashboard/alerts` | Ambos | Productos bajo el stock mínimo. El Administrador marca la alerta como atendida o envía el pedido al proveedor, con vista previa del correo |
| Documentos DPI | `/dashboard/documents/dpi` | Ambos | Fotocopia de DPI (anverso y reverso en una hoja) y hoja de fotos tamaño cédula o pasaporte |
| Reportes | `/dashboard/reports` | Ambos | Ventas por rango de fechas e inventario, con indicadores, tablas y gráficas; se descargan en PDF o Excel |
| Usuarios | `/dashboard/users` | Administrador | Crear, editar, activar y desactivar cuentas |
| Perfil | `/dashboard/profile` | Ambos | Datos de la cuenta, cambio de contraseña y de correo, y activar o desactivar el segundo factor |

Al iniciar sesión, el Administrador entra al dashboard y el Encargado a Ventas.

## Cómo funciona por dentro

- **Sesión.** El backend deja el JWT en una cookie HttpOnly; el navegador la envía solo (`withCredentials`) y el frontend nunca ve ni guarda el token. Al cargar la página, `AuthContext` pregunta a `/auth/user/details` quién es el usuario. Si cualquier petición recibe un 401, se cierra la sesión local y se vuelve al login sin recargar.
- **Inicio de sesión en dos pasos.** `POST /auth/login` responde `twoFactorRequired` cuando la cuenta lo tiene activo; entonces la pantalla pide el código y lo valida con `/auth/2fa/verify` (con opción de reenviarlo).
- **Rutas protegidas.** `PrivateRoute` exige sesión, `GuestRoute` impide ver el login a quien ya entró y `RoleRoute` revisa el rol. Cada ruta declara sus roles en `src/routes.jsx`, y de ahí sale también el menú lateral (`src/auth/menuByRole.js`).
- **Servicios.** Cada recurso de la API tiene su archivo en `src/services/` (productos, ventas, proveedores, alertas, reportes, documentos…) sobre una única instancia de Axios (`api.js`).
- **Fotos grandes.** Las fotos del celular pesan 4 a 10 MB. Antes de subirlas se reducen en el navegador a 2560 px de lado mayor (`src/utils/imageDownscale.js`), porque el documento final no necesita más y así la subida cabe en el límite de 26 s del proxy de Netlify.

## Documentos de DPI y fotos de cédula/pasaporte

- **Fotocopia de DPI:** se sube el anverso y el reverso; el sistema detecta solo las esquinas de la tarjeta, se pueden ajustar a mano, girar cada cara, y regular brillo, contraste y nitidez con vista previa. Sale como PDF o Word (`.docx`) con el nombre del cliente.
- **Fotos tamaño cédula o pasaporte:** se sube una foto, se elige el marco de recorte y se repite en una hoja de papel fotográfico 4×6 in. Las medidas y la cantidad de copias por hoja las informa el backend, así que el frontend no las tiene escritas.
- Hay que imprimir al 100 % (sin "ajustar a la página") para que cada foto mida lo que dice.

## Estructura del proyecto

```
src/
  pages/        landing/, auth/ (login, 2FA, recuperación) y dashboard/ (una carpeta por módulo)
  components/   piezas compartidas: rutas protegidas, escáner de código de barras, recorte de fotos,
                ajustes de imagen, diálogo de pedido a proveedor
  services/     un archivo por recurso del backend, sobre api.js (Axios)
  context/      AuthContext (sesión y rol) y FeedbackContext (mensajes al usuario)
  hooks/        useAuth, useProducts, useNotifications, useDashboardData y los de las fotos
  auth/         menú y pantalla de inicio según el rol
  layouts/      diseño del dashboard (con menú) y de las pantallas de acceso
  widgets/      piezas de diseño de la plantilla: barra lateral, barra superior, tarjetas y gráficas
  utils/        funciones puras con pruebas: formatos, fechas, validadores, recorte, código de barras…
  routes.jsx    rutas del dashboard, con su rol y su icono
public/         _redirects (proxy al backend), _headers (caché y cabeceras) e imágenes
```

El alias `@` apunta a `src/` (por ejemplo `import api from "@/services/api"`).

## Correr en local

Requiere Node 24 (`.nvmrc`) y el backend corriendo en `localhost:8080` (ver su README; allí hay que poner `COOKIE_SECURE=false` para trabajar por `http://localhost`).

```bash
cp .env.example .env     # VITE_API_URL=http://localhost:8080
npm ci
npm run dev              # http://localhost:5173
```

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm run build` | Genera `dist/` para producción |
| `npm run preview` | Sirve `dist/` localmente |
| `npm test` | Pruebas unitarias con Vitest (`*.test.js`, junto al código que prueban) |

`VITE_API_URL` se incrusta en el bundle al compilar, así que nunca debe llevar secretos. En desarrollo apunta al backend (`http://localhost:8080`); en producción vale `/` (ver abajo). Para entrar hace falta un usuario; en una base nueva existe `admin`, cuya contraseña sembrada es pública en el historial del repositorio (ver el README del backend) y debe cambiarse de inmediato.

Con Docker (opcional; en producción se usa Netlify): `Dockerfile` compila y sirve `dist/` con Nginx (`--build-arg VITE_API_URL=...`, con el proxy de `nginx.conf` hacia el backend) y `Dockerfile.dev` levanta Vite con recarga en caliente.

## Producción (Netlify)

- `npm run build` toma `VITE_API_URL=/` de `.env.production`: el navegador llama a `/api/...` y `/auth/...` en el mismo dominio de Netlify.
- `public/_redirects` hace de proxy hacia el backend en Railway (así la cookie de sesión es de primera parte y no hay CORS en el navegador) y sirve `index.html` en las rutas del SPA. Solo van al backend `/api/*` y estos endpoints de `/auth/`: `login`, `logout`, `check-auth`, `user/details`, `2fa/verify`, `2fa/resend`, `forgot-password` y `reset-password`. Las páginas `/auth/sign-in`, `/auth/forgot` y `/auth/reset` son del SPA y no se proxean.
- El proxy de Netlify corta cada petición a los 26 s, contando la subida; de ahí la reducción de fotos descrita arriba.
- `public/_headers`: caché permanente para `/assets/*` y cabeceras de seguridad básicas (`nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`).
- Si cambia el dominio del backend en Railway, hay que actualizarlo en `public/_redirects`: el CI verifica que el proxy apunte a un backend real.

## CI/CD

`.github/workflows/ci-cd.yml`:

- **CI** (PRs y push a `develop`/`main`): `npm ci`, `npm test`, `npm run build` y verificación de que `_redirects` apunta a un backend real.
- **Deploy** (push a `main`): publica `dist/` con Netlify CLI (`--prod --no-build`) y comprueba que el SPA responde y que el proxy llega al backend (`/auth/user/details` sin sesión debe dar 401).

En GitHub: environment `production` (solo rama `main`) con los secretos `NETLIFY_AUTH_TOKEN` (token personal de Netlify) y `NETLIFY_SITE_ID` (Project ID del sitio), y la variable de repositorio `FRONTEND_URL`. El sitio de Netlify se crea sin Git conectado: los deploys llegan solo desde GitHub Actions.

Revertir un deploy: en Netlify, desde la lista de despliegues del sitio, publicar de nuevo uno anterior (los nombres exactos del menú pueden variar). El frontend no tiene base de datos, así que el rollback es inmediato.

## Problemas frecuentes

| Síntoma | Causa probable |
|---|---|
| Inicia sesión pero al recargar vuelve al login | La cookie no se guarda. En local, el backend necesita `COOKIE_SECURE=false`; en producción, revisar que las llamadas pasen por el proxy de Netlify (`VITE_API_URL=/`) |
| Error de CORS en la consola en local | `CORS_ALLOWED_ORIGINS` del backend no incluye `http://localhost:5173` |
| No llegan los códigos de verificación ni el enlace de recuperación | El backend no tiene correo configurado (`BREVO_API_KEY` o `MAIL_*`) o `FRONTEND_URL` está mal |
| El escáner de códigos de barras no abre la cámara | El navegador solo da acceso a la cámara en HTTPS o `localhost`, y hay que aceptar el permiso |
| La subida de una foto falla por tiempo | Revisar la conexión; las fotos ya se reducen a 2560 px, pero el proxy corta a los 26 s |
| `/auth/sign-in` responde 500 al recargar (Docker) | En `nginx.conf` las rutas de `/auth/` se listan una por una a propósito; no usar un `location /auth/` genérico |
