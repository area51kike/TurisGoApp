# TURISGO

Prototipo móvil para descubrir destinos y hoteles de El Salvador, guardar lugares, ver fichas con fotos y mapa, planificar un presupuesto y explorar perfiles personales o empresariales.

## Funciones incluidas

- Búsqueda de destinos y hoteles, favoritos y fichas con galería, puntuación, precio de referencia e indicaciones.
- Mapa de Google integrado en la app y opción para abrir indicaciones en Google Maps.
- Descarga de destinos como archivos GPX para llevarlos a una app de navegación compatible.
- Presupuesto con estimados de viaje desde San Salvador. Los gastos adicionales se habilitan al agregar un destino; parques sin entrada se muestran como acceso gratuito.
- Reseñas de muestra y publicación de reseñas para cuentas con visita verificada por ubicación; las reseñas y respuestas empresariales se comparten con Firestore.
- Tutorial bloqueante de cuatro pasos, español/inglés, temas, paletas personalizadas de tres colores y una lista amplia de fuentes.
- Registro e inicio de sesión con Firebase Authentication: solicita nombre, nombre de usuario único, correo, teléfono y tipo de cuenta (personal o empresarial).
- Chat privado en tiempo real con búsqueda de usuarios y mensajes en Firebase Firestore.
- Perfil empresarial Premium de demostración: categorías turísticas, fotos, ubicación, sucursales, panel de reseñas, comisión fija informativa del 3% y recordatorio mensual.
- Vista previa de TURISGO Premium para revisar el flujo empresarial sin realizar un cobro.
- Navegación adaptable a teléfonos, áreas seguras de iOS y metadatos para abrir TURISGO desde la pantalla de inicio.

Favoritos, presupuesto y preferencias usan almacenamiento local. Cuentas, nombres de usuario únicos, chat, reseñas, respuestas empresariales y fichas públicas se conectan a Firebase. Las fotos empresariales se comprimen en el dispositivo y se guardan como datos de imagen en Firestore para que el flujo de publicación no dependa de Firebase Storage.

## Activar cuentas y chat en Firebase

1. En Firebase Console, abre **Authentication → Sign-in method** y habilita **Email/Password**.
2. En **Authentication → Settings → Authorized domains**, incluye el dominio publicado y `localhost` para desarrollo local.
3. Publica las reglas incluidas en [`firestore.rules`](firestore.rules) desde **Firestore Database → Rules**. Las reglas limitan los perfiles de cuenta, reservas de nombres, mensajes privados, reseñas y propiedad de fichas empresariales.
4. Activa **Storage** y publica [`storage.rules`](storage.rules) desde **Storage → Rules** para permitir fotos de perfil privadas y fotos empresariales públicas.
5. La aplicación guarda teléfonos en documentos privados `accounts/{uid}`; no los expone en la búsqueda pública de viajeros.

La vista Premium no procesa pagos. La comisión fija del 3% es solo informativa hasta integrar reservas y pagos.

## Desarrollo local

```bash
npm ci
npm run dev
```

## Despliegue

El workflow [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) compila la app y publica `dist/spa` en GitHub Pages después de cada actualización de `main`. La configuración de compilación usa la ruta `/TurisGoApp/` del repositorio.

URL prevista: <https://area51kike.github.io/TurisGoApp/>
