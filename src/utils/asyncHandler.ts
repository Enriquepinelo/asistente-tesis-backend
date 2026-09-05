import { Request, Response, NextFunction, RequestHandler } from "express";

// Envuelve controladores async para que cualquier error caiga
// automaticamente en el middleware centralizado de errores,
// sin necesidad de repetir try/catch en cada controlador.
export function asyncHandler(fn: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
