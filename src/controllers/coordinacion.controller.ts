import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import * as repo from "../repositories/coordinacion.repository";

function leerId(req: Request): number {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) throw new AppError("Identificador inválido.", 400);
  return id;
}

export const resumen = asyncHandler(async (_req: Request, res: Response) => {
  const [propuestas, formularios, areas, ia] = await Promise.all([
    repo.propuestasPorEstado(),
    repo.formulariosPorEstado(),
    repo.areasMasSolicitadas(),
    repo.rendimientoIA(),
  ]);
  res.json({ exito: true, propuestas, formularios, areas, ia });
});

export const estudiantes = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ exito: true, estudiantes: await repo.listarEstudiantes() });
});

export const detalleEstudiante = asyncHandler(async (req: Request, res: Response) => {
  const detalle = await repo.detalleEstudiante(leerId(req));
  if (!detalle) throw new AppError("El estudiante no existe.", 404);
  res.json({ exito: true, ...detalle });
});

export const cuentasPendientes = asyncHandler(async (_req: Request, res: Response) => {
  res.json({ exito: true, cuentas: await repo.cuentasPendientes() });
});

export const activarCuenta = asyncHandler(async (req: Request, res: Response) => {
  const ok = await repo.activarCuentaEstudiante(leerId(req));
  if (!ok) throw new AppError("La cuenta no existe o no es de un estudiante.", 404);
  res.json({ exito: true, mensaje: "Cuenta activada." });
});
