# Backend "Asistente de Tesis" — Guía de instalación (Windows)

Esta guía asume que NO sabes programar. Sigue los pasos en orden, sin saltarte ninguno.

## 1. Ubica la carpeta

Descomprime el archivo ZIP en una carpeta de tu computadora, por ejemplo:
`C:\Proyectos\asistente-web-tesis\`

Dentro encontrarás la carpeta `backend`.

## 2. Abre una terminal en la carpeta backend

- Abre el Explorador de archivos y entra a la carpeta `backend`.
- Haz clic en la barra de direcciones de arriba, escribe `cmd` y presiona Enter.
  (Esto abre una ventana negra de comandos ya ubicada dentro de `backend`).

## 3. Instala las dependencias

En esa ventana negra, escribe exactamente esto y presiona Enter:

```
npm install
```

Espera a que termine (puede tardar 1–3 minutos). Verás muchas líneas de texto, es normal.

## 4. Crea tu archivo de configuración

- Dentro de la carpeta `backend`, copia el archivo `.env.example`.
- Pega la copia en la misma carpeta y renómbrala a `.env` (sin nombre antes del punto).
- Abre `.env` con el Bloc de notas y completa estas líneas con tus datos reales de MySQL:

```
DB_USER=tu_usuario_de_mysql
DB_PASSWORD=tu_contraseña_de_mysql
JWT_SECRET=escribe_aqui_cualquier_texto_largo_y_dificil_de_adivinar
```

No compartas ni subas este archivo `.env` a ningún lado — contiene tu contraseña real.

## 5. Ejecuta el servidor

En la misma ventana de comandos, escribe:

```
npm run dev
```

Si todo está bien, verás un mensaje como:

```
Conexion a MySQL (asistente_tesis) verificada correctamente.
Servidor backend "Asistente de Tesis" escuchando en http://localhost:3000
```

Deja esa ventana abierta mientras trabajas — si la cierras, el servidor se apaga.

## 6. Verifica que funciona

Abre tu navegador (Chrome, Edge, etc.) y entra a:

```
http://localhost:3000/api/salud
```

Debes ver un mensaje JSON como:
`{"exito":true,"mensaje":"El servidor está funcionando correctamente."}`

Si ves eso, el backend está funcionando correctamente.

## Problemas comunes

- **"npm no se reconoce como un comando"** → Node.js no está instalado o no se instaló correctamente. Reinstálalo desde nodejs.org.
- **"No se pudo iniciar el servidor: falló la conexión a MySQL"** → Revisa que MySQL Server esté encendido y que el usuario/contraseña en `.env` sean correctos.
- **Puerto 3000 ocupado** → Cambia `PORT=3000` a `PORT=3001` en tu `.env` y vuelve a ejecutar `npm run dev`.
- La ventana de comandos se cierra sola → Ábrela de nuevo y vuelve a escribir `npm run dev`; revisa el mensaje de error que aparece justo antes de cerrarse.

## Endpoints disponibles (para probar más adelante con el frontend o con una herramienta como Postman/Thunder Client)

Autenticación: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
Panel: `GET /api/dashboard/resumen`, `GET /api/dashboard/actividad-reciente`
Formularios: `GET /api/formularios`, `GET /api/formularios/:id`, `POST /api/formularios`, `PUT /api/formularios/:id`, `POST /api/formularios/:id/guardar-borrador`, `POST /api/formularios/:id/generar-propuesta`
Propuestas: `GET /api/propuestas`, `GET /api/propuestas/:id`, `GET /api/propuestas/:id/descargar`
Historial: `GET /api/historial`, `GET /api/historial/resumen`
Recomendaciones: `GET /api/recomendaciones`, `GET /api/recomendaciones?prioridad=alta`

Todas las rutas excepto `/api/auth/login` y `/api/salud` requieren enviar el token JWT en el header:
`Authorization: Bearer TU_TOKEN_AQUI`
