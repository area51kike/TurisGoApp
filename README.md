# TURISGO

Prototipo móvil para descubrir destinos y hoteles de El Salvador, guardar lugares, ver fichas con fotos y mapa, planificar un presupuesto y explorar perfiles personales o empresariales.

## Funciones incluidas

- Búsqueda de destinos y hoteles, favoritos y fichas con galería, puntuación, precio de referencia e indicaciones.
- Mapa de Google integrado en la app y opción para abrir indicaciones en Google Maps.
- Descarga de destinos como archivos GPX para llevarlos a una app de navegación compatible.
- Presupuesto con estimados de viaje desde San Salvador y gastos editables.
- Reseñas de muestra y formulario de reseña habilitado solo después de verificar la ubicación a menos de 2.5 km del lugar.
- Tutorial bloqueante de cuatro pasos, español/inglés, temas y tipografías guardados en el dispositivo.
- Perfil empresarial de demostración: URLs públicas de fotos, ubicación, sucursales, panel de reseñas, vista de comisión y actualización obligatoria cada 30 días para conservar la ficha destacada.
- Vista previa de TURISGO Premium para revisar el flujo empresarial sin realizar un cobro.
- Navegación adaptable a teléfonos, áreas seguras de iOS y metadatos para abrir TURISGO desde la pantalla de inicio.

Los mensajes, favoritos, reseñas y preferencias usan almacenamiento local para la demostración. Los perfiles personales intentan guardarse en `userProfiles/{username}` y las fichas empresariales en `businessProfiles/{id}` de Firestore; el borrador local se conserva si las reglas rechazan la operación. Las fotos se guardan como URLs HTTPS: los archivos deben estar alojados previamente en una dirección pública.

El inicio de sesión, los cobros Premium, el chat en tiempo real y las notificaciones push aún no están conectados. Antes de aceptar datos de clientes, configura Firebase Authentication y reglas de Firestore que limiten quién puede leer o escribir cada perfil y reseña.

## Desarrollo local

```bash
npm ci
npm run dev
```

## Despliegue

El workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) compila la app y publica `dist/spa` en GitHub Pages después de cada actualización de `main`. La configuración de compilación usa la ruta `/TurisGoApp/` del repositorio.

URL prevista: <https://area51kike.github.io/TurisGoApp/>
