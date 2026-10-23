# Asistente de Tesis — Backend

Backend del sistema **Asistente Web para la Planificación de Tesis**, proyecto de graduación de Ingeniería en Sistemas, Universidad Mariano Gálvez de Guatemala.

El sistema ayuda a los estudiantes a generar una propuesta preliminar de tesis (temas, planteamiento del problema, objetivos y justificación) con inteligencia artificial (Google Gemini), orquestada con n8n.

## Arquitectura

```
Frontend (React + Vite)  →  Backend (Express + TypeScript)  →  n8n (webhook)  →  Google Gemini
                                     │                              │
                                     └──────────  MySQL  ◄──────────┘
```

- El frontend solo se comunica con el backend.
- El backend autentica con JWT y envía la solicitud al workflow de n8n.
- n8n valida los datos, genera la propuesta con Gemini y la guarda en MySQL.

## Tecnologías

| Componente | Tecnología |
|---|---|
| Backend | Node.js, Express, TypeScript |
| Base de datos | MySQL 8 (`asistente_tesis`, 6 tablas) |
| Autenticación | JWT + bcrypt |
| Validación | Zod |
| Orquestación | n8n |
| IA | Google Gemini |
| Despliegue | Render (backend y n8n), Aiven (MySQL), Neon (BD interna de n8n) |

## Estructura

```
src/
├── config/        Conexión a MySQL
├── controllers/   Reciben la petición y devuelven la respuesta
├── middleware/    Autenticación JWT y manejo de errores
├── repositories/  Consultas a la base de datos
├── routes/        Definición de rutas de la API
├── services/      Lógica de negocio e integración con n8n
├── types/         Tipos de TypeScript
├── utils/         Utilidades
└── validators/    Validación de datos con Zod
Workflow/          Workflow exportado de n8n (importable)
certs/             Certificado CA público de Aiven
```

## Rutas principales de la API (`/api`)

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/salud` | Estado del servidor |
| POST | `/auth/login` | Inicio de sesión (devuelve JWT) |
| GET | `/auth/me` | Datos del usuario autenticado |
| POST | `/formularios` | Crea el formulario de tesis (borrador) |
| POST | `/formularios/:id/generar-propuesta` | Envía el formulario a n8n y genera la propuesta |
| GET | `/historial` | Historial de solicitudes |
| GET | `/dashboard/resumen` | Resumen para el panel |

## Instalación local

1. Instalar Node.js 20 o superior y MySQL.
2. Clonar el repositorio e instalar dependencias:
   ```
   git clone https://github.com/Enriquepinelo/asistente-tesis-backend.git
   cd asistente-tesis-backend
   npm install
   ```
3. Copiar `.env.example` como `.env` y completar los valores.
4. Iniciar en modo desarrollo:
   ```
   npm run dev
   ```
5. Probar: `http://localhost:3000/api/salud`

## Workflow de n8n

1. En n8n, crear un workflow nuevo e importar `Workflow/workflow-planificador-tesis.json`.
2. Configurar las credenciales (no vienen en el archivo): **Google Gemini** (API key de Google AI Studio) y **MySQL** (base `asistente_tesis`).
3. Publicar el workflow y copiar la URL del webhook en `N8N_GENERATE_PROPOSALS_WEBHOOK_URL`.

## Despliegue

- **Build command:** `npm install && npm run build`
- **Start command:** `node dist/server.js`
- Variables de entorno: las de `.env.example`.

## Autor

Gerberth Enrique Pinelo — Ingeniería en Sistemas, UMG.
