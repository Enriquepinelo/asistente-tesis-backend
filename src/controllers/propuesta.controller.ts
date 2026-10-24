import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import * as propuestaService from "../services/propuesta.service";
import { EstadoPropuesta } from "../types/models";

function exigirIdEstudiante(req: Request): number {
  if (!req.usuario?.id_estudiante) {
    throw new AppError("Esta acción solo está disponible para estudiantes.", 403);
  }
  return req.usuario.id_estudiante;
}

// El asesor, el coordinador y el administrador ven las propuestas de todos los estudiantes.
const ROLES_PERSONAL = ["asesor", "coordinador", "administrador"];
const esPersonal = (req: Request) => !!req.usuario && ROLES_PERSONAL.includes(req.usuario.rol);

const ESTADOS_VALIDOS: EstadoPropuesta[] = ["generada", "revisada", "ajustada", "aprobada"];

function leerId(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new AppError("Identificador de propuesta inválido.", 400);
  return id;
}

export const listar = asyncHandler(async (req: Request, res: Response) => {
  if (esPersonal(req)) {
    const propuestas = await propuestaService.listarTodas();
    return res.json({ exito: true, propuestas });
  }
  const idEstudiante = exigirIdEstudiante(req);
  const propuestas = await propuestaService.listarPropuestas(idEstudiante);
  res.json({ exito: true, propuestas });
});

export const obtener = asyncHandler(async (req: Request, res: Response) => {
  if (esPersonal(req)) {
    const propuesta = await propuestaService.obtenerPropuestaParaPersonal(leerId(req));
    return res.json({ exito: true, propuesta });
  }
  const idEstudiante = exigirIdEstudiante(req);
  const idPropuesta = leerId(req);
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

// Solo el asesor y el coordinador cambian el estado de revision de una propuesta.
export const cambiarEstado = asyncHandler(async (req: Request, res: Response) => {
  const estado = req.body?.estado as EstadoPropuesta;
  if (!ESTADOS_VALIDOS.includes(estado)) {
    throw new AppError("El estado debe ser generada, revisada, ajustada o aprobada.", 400);
  }
  await propuestaService.cambiarEstado(leerId(req), estado);
  res.json({ exito: true, mensaje: "Estado de la propuesta actualizado." });
});
