import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import { obtenerResumenDashboard, obtenerActividadReciente } from "../services/dashboard.service";

function exigirIdEstudiante(req: Request): number {
  if (!req.usuario?.id_estudiante) {
    throw new AppError("Esta acción solo está disponible para estudiantes.", 403);
  }
  return req.usuario.id_estudiante;
}

export const resumen = asyncHandler(async (req: Request, res: Response) => {
  const idEstudiante = exigirIdEstudiante(req);
  const datos = await obtenerResumenDashboard(idEstudiante);
  res.json({ exito: true, ...datos });
});

export const actividadReciente = asyncHandler(async (req: Request, res: Response) => {
  const idEstudiante = exigirIdEstudiante(req);
  const actividad = await obtenerActividadReciente(idEstudiante);
  res.json({ exito: true, actividad });
});
