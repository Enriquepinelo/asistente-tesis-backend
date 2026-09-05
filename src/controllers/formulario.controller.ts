import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import {
  formularioBorradorSchema,
  formularioGenerarPropuestaSchema,
} from "../validators/formulario.validator";
import * as formularioService from "../services/formulario.service";

function exigirIdEstudiante(req: Request): number {
  if (!req.usuario?.id_estudiante) {
    throw new AppError("Esta acción solo está disponible para estudiantes.", 403);
  }
  return req.usuario.id_estudiante;
}

export const listar = asyncHandler(async (req: Request, res: Response) => {
  const idEstudiante = exigirIdEstudiante(req);
  const formularios = await formularioService.listarFormularios(idEstudiante);
  res.json({ exito: true, formularios });
});

export const obtener = asyncHandler(async (req: Request, res: Response) => {
  const idEstudiante = exigirIdEstudiante(req);
  const idFormulario = Number(req.params.id);
  const formulario = await formularioService.obtenerFormulario(idFormulario, idEstudiante);
  res.json({ exito: true, formulario });
});

export const crear = asyncHandler(async (req: Request, res: Response) => {
  const idEstudiante = exigirIdEstudiante(req);
  const resultado = formularioBorradorSchema.safeParse(req.body);
  if (!resultado.success) {
    throw new AppError(resultado.error.errors[0]?.message ?? "Datos inválidos.", 400);
  }
  const formulario = await formularioService.guardarBorrador(idEstudiante, null, resultado.data);
  res.status(201).json({ exito: true, mensaje: "Formulario creado.", formulario });
});

export const actualizar = asyncHandler(async (req: Request, res: Response) => {
  const idEstudiante = exigirIdEstudiante(req);
  const idFormulario = Number(req.params.id);
  const resultado = formularioBorradorSchema.safeParse(req.body);
  if (!resultado.success) {
    throw new AppError(resultado.error.errors[0]?.message ?? "Datos inválidos.", 400);
  }
  const formulario = await formularioService.guardarBorrador(idEstudiante, idFormulario, resultado.data);
  res.json({ exito: true, mensaje: "Formulario actualizado.", formulario });
});

export const guardarBorrador = asyncHandler(async (req: Request, res: Response) => {
  const idEstudiante = exigirIdEstudiante(req);
  const idFormulario = req.params.id ? Number(req.params.id) : null;
  const resultado = formularioBorradorSchema.safeParse(req.body);
  if (!resultado.success) {
    throw new AppError(resultado.error.errors[0]?.message ?? "Datos inválidos.", 400);
  }
  const formulario = await formularioService.guardarBorrador(idEstudiante, idFormulario, resultado.data);
  res.json({ exito: true, mensaje: "Borrador guardado correctamente.", formulario });
});

export const generarPropuesta = asyncHandler(async (req: Request, res: Response) => {
  const idEstudiante = exigirIdEstudiante(req);
  const idFormulario = req.params.id ? Number(req.params.id) : null;
  const resultado = formularioGenerarPropuestaSchema.safeParse(req.body);
  if (!resultado.success) {
    throw new AppError(resultado.error.errors[0]?.message ?? "Datos inválidos.", 400);
  }
  const respuesta = await formularioService.generarPropuesta(idEstudiante, idFormulario, resultado.data);
  res.json({ exito: true, mensaje: "Propuesta en proceso de generación.", ...respuesta });
});
