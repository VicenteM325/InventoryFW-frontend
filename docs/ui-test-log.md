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
