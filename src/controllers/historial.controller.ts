import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import * as historialService from "../services/historial.service";

function exigirIdEstudiante(req: Request): number {
  if (!req.usuario?.id_estudiante) {
    throw new AppError("Esta acción solo está disponible para estudiantes.", 403);
  }
  return req.usuario.id_estudiante;
}

export const listar = asyncHandler(async (req: Request, res: Response) => {
  const idEstudiante = exigirIdEstudiante(req);
  const historial = await historialService.listarHistorial(idEstudiante);
  res.json({ exito: true, historial });
});

export const resumen = asyncHandler(async (req: Request, res: Response) => {
  const idEstudiante = exigirIdEstudiante(req);
  const datos = await historialService.obtenerResumenHistorial(idEstudiante);
  res.json({ exito: true, resumen: datos });
});
