import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";

// Middleware centralizado de errores. Es el UNICO lugar del backend
// que decide que mensaje ve el usuario final. Nunca reenvia mensajes
// crudos de MySQL, ni stack traces, al cliente.
export function manejadorDeErrores(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      exito: false,
      mensaje: err.message,
    });
  }

  // Error no controlado (por ejemplo, un fallo real de MySQL o un bug).
  // Se registra completo en la consola del servidor para depuracion,
  // pero al usuario solo se le muestra un mensaje generico.
  console.error("Error no controlado:", err);

  return res.status(500).json({
    exito: false,
    mensaje: "Ocurrió un error inesperado. Intente nuevamente más tarde.",
  });
}

export function rutaNoEncontrada(req: Request, res: Response) {
  res.status(404).json({
    exito: false,
    mensaje: `La ruta ${req.method} ${req.originalUrl} no existe.`,
  });
}
