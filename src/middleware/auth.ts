import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AppError } from "../utils/AppError";
import { JwtPayload, RolUsuario } from "../types/models";

// Verifica que la peticion incluya un token JWT valido en el header
// "Authorization: Bearer <token>". Si es valido, adjunta los datos
// del usuario a req.usuario para que los controladores los usen.
export function requiereAutenticacion(req: Request, _res: Response, next: NextFunction) {
  const encabezado = req.headers.authorization;

  if (!encabezado || !encabezado.startsWith("Bearer ")) {
    return next(new AppError("Debe iniciar sesión para continuar.", 401));
  }

  const token = encabezado.substring("Bearer ".length);

  try {
    const secreto = process.env.JWT_SECRET as string;
    const datos = jwt.verify(token, secreto) as JwtPayload;
    req.usuario = datos;
    next();
  } catch {
    return next(new AppError("Sesión inválida o expirada. Inicie sesión nuevamente.", 401));
  }
}

// Restringe el acceso a una ruta segun el/los rol(es) permitidos.
// Uso: router.get("/ruta", requiereAutenticacion, permitirRoles("administrador"), controlador)
export function permitirRoles(...rolesPermitidos: RolUsuario[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return next(new AppError("No tiene permisos para realizar esta acción.", 403));
    }
    next();
  };
}
