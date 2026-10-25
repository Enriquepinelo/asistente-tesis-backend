import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import * as usuarioService from "../services/usuario.service";
import { crearUsuarioSchema, cambiarEstadoSchema } from "../validators/usuario.validator";

export const listar = asyncHandler(async (_req: Request, res: Response) => {
  const usuarios = await usuarioService.listarUsuarios();
  res.json({ exito: true, usuarios });
});

export const crear = asyncHandler(async (req: Request, res: Response) => {
  const resultado = crearUsuarioSchema.safeParse(req.body);
  if (!resultado.success) {
    throw new AppError(resultado.error.errors[0]?.message ?? "Datos inválidos.", 400);
  }
  const usuario = await usuarioService.crearUsuario(resultado.data);
  res.status(201).json({ exito: true, mensaje: "Usuario creado correctamente.", usuario });
});

export const cambiarEstado = asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new AppError("Identificador de usuario inválido.", 400);
  const resultado = cambiarEstadoSchema.safeParse(req.body);
  if (!resultado.success) {
    throw new AppError(resultado.error.errors[0]?.message ?? "Datos inválidos.", 400);
  }
  await usuarioService.cambiarEstado(id, resultado.data.estado, req.usuario!.id_usuario);
  res.json({ exito: true, mensaje: "Estado actualizado." });
});

function leerId(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new AppError("Identificador de usuario inválido.", 400);
  return id;
}

export const cambiarRol = asyncHandler(async (req: Request, res: Response) => {
  await usuarioService.cambiarRol(leerId(req), String(req.body?.rol ?? ""), req.usuario!.id_usuario);
  res.json({ exito: true, mensaje: "Rol actualizado." });
});

export const restablecerContrasena = asyncHandler(async (req: Request, res: Response) => {
  const temporal = await usuarioService.restablecerContrasena(leerId(req));
  res.json({ exito: true, contrasena_temporal: temporal });
});

export const estadoSistema = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ exito: true, ...(await usuarioService.estadoSistema()) });
});
