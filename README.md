# TURISGO

Prototipo móvil para descubrir destinos y hoteles de El Salvador, guardar lugares, ver fichas con fotos y mapa, planificar un presupuesto y explorar perfiles personales o empresariales.

## Funciones incluidas

- Búsqueda de destinos y hoteles, favoritos y fichas con galería, puntuación, precio de referencia e indicaciones.
- Mapa de Google integrado en la app y opción para abrir indicaciones en Google Maps.
- Descarga de destinos como archivos GPX para llevarlos a una app de navegación compatible.
- Presupuesto con estimados de viaje desde San Salvador. Los gastos adicionales se habilitan al agregar un destino; parques sin entrada se muestran como acceso gratuito.
- Reseñas de muestra y formulario de reseña habilitado solo después de verificar la ubicación a menos de 2.5 km del lugar.
- Tutorial bloqueante de cuatro pasos, español/inglés, temas y tipografías guardados en el dispositivo.
- Registro e inicio de sesión con Firebase Authentication: solicita nombre, nombre de usuario único, correo, teléfono y tipo de cuenta (personal o empresarial).
- Chat privado en tiempo real con búsqueda de usuarios y mensajes en Firebase Firestore.
- Perfil empresarial de demostración: categorías turísticas, URLs públicas de fotos, ubicación, sucursales, panel de reseñas, comisión fija informativa del 3% y recordatorio mensual.
- Vista previa de TURISGO Premium para revisar el flujo empresarial sin realizar un cobro.
- Navegación adaptable a teléfonos, áreas seguras de iOS y metadatos para abrir TURISGO desde la pantalla de inicio.

Favoritos, presupuesto, reseñas de demostración y preferencias usan almacenamiento local. Cuentas, nombres de usuario únicos, perfiles públicos mínimos y mensajes se conectan a Firebase. Las fotos se guardan como URLs HTTPS: los archivos deben estar alojados previamente en una dirección pública.

## Activar cuentas y chat en Firebase

1. En Firebase Console, abre **Authentication → Sign-in method** y habilita **Email/Password**.
2. En **Authentication → Settings → Authorized domains**, incluye el dominio publicado y `localhost` para desarrollo local.
3. Publica las reglas incluidas en [`firestore.rules`](firestore.rules) desde **Firestore Database → Rules**. Las reglas limitan los perfiles de cuenta, reservas de nombres, mensajes privados y propiedad de fichas empresariales.
4. La aplicación guarda teléfonos en documentos privados `accounts/{uid}`; no los expone en la búsqueda pública de viajeros.

La vista Premium no procesa pagos. La comisión fija del 3% es solo informativa hasta integrar reservas y pagos.

## Desarrollo local

```bash
npm ci
npm run dev
```

## Despliegue

El workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) compila la app y publica `dist/spa` en GitHub Pages después de cada actualización de `main`. La configuración de compilación usa la ruta `/TurisGoApp/` del repositorio.

URL prevista: <https://area51kike.github.io/TurisGoApp/>
