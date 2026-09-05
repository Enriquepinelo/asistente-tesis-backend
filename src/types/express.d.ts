import { JwtPayload } from "./models";

// Extiende el tipo Request de Express para incluir al usuario autenticado,
// una vez que el middleware de autenticacion valida el token JWT.
declare global {
  namespace Express {
    interface Request {
      usuario?: JwtPayload;
    }
  }
}

export {};
