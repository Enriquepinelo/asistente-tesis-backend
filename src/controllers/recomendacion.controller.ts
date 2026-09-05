import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import * as recomendacionService from "../services/recomendacion.service";
import { Prioridad } from "../types/models";

function exigirIdEstudiante(req: Request): number {
  if (!req.usuario?.id_estudiante) {
    throw new AppError("Esta acción solo está disponible para estudiantes.", 403);
  }
  return req.usuario.id_estudiante;
}

const PRIORIDADES_VALIDAS: Prioridad[] = ["alta", "media", "baja"];

export const listar = asyncHandler(async (req: Request, res: Response) => {
  const idEstudiante = exigirIdEstudiante(req);
  const prioridadQuery = req.query.prioridad as string | undefined;

  let filtro: Prioridad | undefined;
  if (prioridadQuery) {
    if (!PRIORIDADES_VALIDAS.includes(prioridadQuery as Prioridad)) {
      throw new AppError("El filtro de prioridad debe ser alta, media o baja.", 400);
    }
    filtro = prioridadQuery as Prioridad;
  }

  const recomendaciones = await recomendacionService.listarRecomendaciones(idEstudiante, filtro);
  res.json({ exito: true, recomendaciones });
});
