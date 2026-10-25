import { Request, Response, NextFunction } from "express";

// Limita los intentos fallidos de inicio de sesion para frenar ataques de fuerza bruta.
// Se cuenta por correo + IP. Tras MAX_INTENTOS fallos en VENTANA_MS, el login
// queda bloqueado para esa combinacion durante BLOQUEO_MS.
// Se guarda en memoria del servidor: es suficiente para una sola instancia en Render.
const MAX_INTENTOS = 5;
const VENTANA_MS = 15 * 60 * 1000;
const BLOQUEO_MS = 15 * 60 * 1000;

interface Registro {
  fallos: number;
  primerFallo: number;
  bloqueadoHasta: number;
}

const registros = new Map<string, Registro>();

function clave(req: Request): string {
  const correo = typeof req.body?.correo === "string" ? req.body.correo.trim().toLowerCase() : "";
  return `${req.ip}|${correo}`;
}

export function limitarIntentosLogin(req: Request, res: Response, next: NextFunction) {
  const k = clave(req);
  const ahora = Date.now();
  const r = registros.get(k);

  if (r && r.bloqueadoHasta > ahora) {
    const minutos = Math.ceil((r.bloqueadoHasta - ahora) / 60000);
    res.setHeader("Retry-After", String(Math.ceil((r.bloqueadoHasta - ahora) / 1000)));
    return res.status(429).json({
      exito: false,
      mensaje: `Demasiados intentos fallidos. Intente de nuevo en ${minutos} minuto${minutos === 1 ? "" : "s"}.`,
    });
  }

  // Al terminar la respuesta se registra si el intento fallo o se limpia si tuvo exito.
  res.on("finish", () => {
    if (res.statusCode === 401) {
      const actual = registros.get(k);
      if (!actual || ahora - actual.primerFallo > VENTANA_MS) {
        registros.set(k, { fallos: 1, primerFallo: ahora, bloqueadoHasta: 0 });
      } else {
        actual.fallos += 1;
        if (actual.fallos >= MAX_INTENTOS) actual.bloqueadoHasta = Date.now() + BLOQUEO_MS;
      }
    } else if (res.statusCode === 200) {
      registros.delete(k);
    }
  });

  next();
}

// Limpieza periodica para que el mapa no crezca sin limite.
setInterval(() => {
  const ahora = Date.now();
  for (const [k, r] of registros) {
    if (r.bloqueadoHasta < ahora && ahora - r.primerFallo > VENTANA_MS) registros.delete(k);
  }
}, 10 * 60 * 1000).unref();
