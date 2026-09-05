import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { loginSchema } from "../validators/auth.validator";
import { iniciarSesion } from "../services/auth.service";
import { AppError } from "../utils/AppError";
import { buscarUsuarioPorId } from "../repositories/usuario.repository";
import { buscarEstudiantePorId } from "../repositories/estudiante.repository";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const resultado = loginSchema.safeParse(req.body);
  if (!resultado.success) {
    const primerError = resultado.error.errors[0]?.message ?? "Datos inválidos.";
    throw new AppError(primerError, 400);
  }

  const { correo, contrasena } = resultado.data;
  const { token, usuario } = await iniciarSesion(correo, contrasena);

  res.json({
    exito: true,
    mensaje: "Sesión iniciada correctamente.",
    token,
    usuario,
  });
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
  // El JWT es "stateless": cerrar sesion es responsabilidad del frontend
  // (borrar el token guardado). Este endpoint existe para consistencia de la API.
  res.json({ exito: true, mensaje: "Sesión cerrada correctamente." });
});

export const obtenerPerfil = asyncHandler(async (req: Request, res: Response) => {
  if (!req.usuario) {
    throw new AppError("No tiene permisos para realizar esta acción.", 403);
  }

  const usuario = await buscarUsuarioPorId(req.usuario.id_usuario);
  if (!usuario) {
    throw new AppError("No tiene permisos para realizar esta acción.", 403);
  }

  let nombreCompleto: string | null = null;
  if (req.usuario.id_estudiante) {
    const estudiante = await buscarEstudiantePorId(req.usuario.id_estudiante);
    nombreCompleto = estudiante?.nombre_completo ?? null;
  }

  res.json({
    exito: true,
    usuario: {
      id_usuario: usuario.id_usuario,
      nombre_usuario: usuario.nombre_usuario,
      correo: usuario.correo,
      rol: usuario.rol,
      id_estudiante: req.usuario.id_estudiante,
      nombre_completo: nombreCompleto,
    },
  });
});
