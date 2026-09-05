import * as historialRepo from "../repositories/historial.repository";
import { HistorialFlujo, EstadoFlujo } from "../types/models";

export async function listarHistorial(idEstudiante: number): Promise<HistorialFlujo[]> {
  return historialRepo.listarHistorialPorEstudiante(idEstudiante);
}

export async function obtenerResumenHistorial(
  idEstudiante: number
): Promise<Record<EstadoFlujo, number> & { total: number }> {
  const conteos = await historialRepo.contarHistorialPorEstudianteYEstado(idEstudiante);
  const total = Object.values(conteos).reduce((suma, valor) => suma + valor, 0);
  return { ...conteos, total };
}
