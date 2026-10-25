# Pruebas empíricas de la interfaz (navegador real)

Fecha: 2026-10-24 · Frontend en `integration/2fa` (Vite dev) contra el backend en `integration/2fa`
con PostgreSQL 15 real y un servidor SMTP local descartable (**no** Mailtrap: faltan credenciales,
ver `InventoryFW-backend/docs/mailtrap-test-log.md`). Chromium headless con Playwright.
**30 de 30 comprobaciones pasaron.**

| Flujo | Verificado |
|---|---|
| Login | enviar vacío muestra el error de validación sin llamar al backend |
| 2FA | tras la contraseña aparece el paso de código con el correo enmascarado; llega el correo con un código de 6 dígitos; código incorrecto muestra el error del backend; formato inválido se rechaza en el cliente; el botón "Reenviar" arranca en cuenta regresiva; el código correcto entra al dashboard |
| Sesión | no queda `token`/`user` en localStorage; al recargar sigue autenticado (verificado contra el backend); sin cookie redirige a `/auth/sign-in` |
| Recuperación | correo inválido rechazado en el cliente; mensaje genérico; el correo trae un enlace a `/auth/reset?token=…`; contraseña débil y confirmación distinta rechazadas; contraseña actualizada y regreso al login; el enlace ya usado se rechaza; `/auth/reset` sin token avisa que el enlace no es válido; login con la contraseña nueva + código |
| Perfil | muestra "Seguridad de la cuenta" y 2FA activa; cambio de contraseña; desactivar 2FA con contraseña; reactivar 2FA confirmando el código recibido por correo |
| Usuarios (admin) | formulario vacío muestra errores; usuario con espacios y contraseña débil/sin confirmar rechazados |

Observación: la consola solo mostró advertencias de la plantilla (`color="dark"` inválido en un
`Button` del sidenav), anteriores a estos cambios y no relacionadas.

No se probó: envío real a Mailtrap, el proxy de Netlify/nginx en ejecución (solo `nginx -t`) ni
dispositivos móviles.

---

# Reportes rediseñados (2026-10-24)

Datos de prueba: 10 productos, 4 empleados y 103 ventas repartidas en 60 días, sembradas en
PostgreSQL 15. Navegador Chromium con Playwright. **24 de 24 comprobaciones pasaron.**

Cifras verificadas de forma independiente con SQL: total Q 291,376.00, 69 transacciones,
248 unidades, periodo anterior Q 132,133.00 / 34 ventas (variación +120.5 % / +102.9 %) y
Q 141,067.00 de la empleada con más ventas.

| Área | Verificado |
|---|---|
| Ventas | indicadores con variación contra el periodo anterior; gráfico de ventas por día; ranking de empleados; productos más vendidos; detalle paginado (10 por página, 7 páginas) con búsqueda |
| Filtros | rangos rápidos (Hoy, 30 días, Este mes); rango invertido y mayor a 366 días muestran error y bloquean la exportación |
| Descargas | PDF y Excel de ventas y PDF de inventario se descargan con nombre y formato correctos |
| Inventario | indicadores por estado, gráfico de dona, productos que requieren atención, listado con búsqueda y alertas |
| Móvil (390 px) | sin desborde horizontal de la página |

Defectos encontrados y corregidos durante la prueba: tabla de detalle recortada por la derecha
(el layout se reorganizó), chips de estado con texto casi invisible (insignias con contraste
legible) y eje con 2.5 / 7.5 en el gráfico de conteos del PDF (ahora enteros).

Limitación conocida: entre 1024 y 1366 px de ancho la tabla de detalle muestra un scroll
horizontal interno (no se corta contenido).

---

# Escáner de códigos de barras con la cámara (2026-10-24)

Chromium (Playwright) con una **cámara simulada** que reproduce un EAN-13 válido (3 s a la vista,
2 s apartado, en bucle). **18 de 18 comprobaciones pasaron.** Backend y PostgreSQL reales.

| Pantalla | Verificado |
|---|---|
| Venta (modo continuo) | lee el código y agrega el producto; mantenerlo a la vista no lo suma otra vez; apartarlo y volver a mostrarlo suma 1; una tercera pasada se bloquea por stock; código inexistente avisa; la entrada manual funciona; quedan las filas y cantidades correctas |
| Productos | tras leer, el diálogo se cierra, el buscador queda con el código y la lista se filtra a 1 producto |
| Crear producto | el campo "Código de barras" queda con el código leído |
| Cámara | al cerrar el diálogo todas las pistas del stream quedan en `ended` (la luz se apaga) |
| Sin cámara | mensaje claro y entrada manual disponible |

No se probó con una cámara física de celular ni en iOS Safari. La cámara exige HTTPS o localhost:
en Netlify funciona; abriendo el servidor de desarrollo por la IP de la red local (HTTP) el
navegador la bloquea y el diálogo lo explica.
