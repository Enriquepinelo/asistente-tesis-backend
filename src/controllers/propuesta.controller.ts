import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import * as propuestaService from "../services/propuesta.service";

function exigirIdEstudiante(req: Request): number {
  if (!req.usuario?.id_estudiante) {
    throw new AppError("Esta acción solo está disponible para estudiantes.", 403);
  }
  return req.usuario.id_estudiante;
}

export const listar = asyncHandler(async (req: Request, res: Response) => {
  const idEstudiante = exigirIdEstudiante(req);
  const propuestas = await propuestaService.listarPropuestas(idEstudiante);
  res.json({ exito: true, propuestas });
});

export const obtener = asyncHandler(async (req: Request, res: Response) => {
  const idEstudiante = exigirIdEstudiante(req);
  const idPropuesta = Number(req.params.id);
  const propuesta = await propuestaService.obtenerPropuesta(idPropuesta, idEstudiante);
  res.json({ exito: true, propuesta });
});

export const descargar = asyncHandler(async (req: Request, res: Response) => {
  const idEstudiante = exigirIdEstudiante(req);
  const idPropuesta = Number(req.params.id);
  const propuesta = await propuestaService.obtenerPropuesta(idPropuesta, idEstudiante);
  const texto = propuestaService.generarTextoDescargable(propuesta);

  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="propuesta_${propuesta.id_propuesta}.txt"`
  );
  res.send(texto);
});
