import { AppError } from "../utils/AppError";
import * as propuestaRepo from "../repositories/propuesta.repository";
import { PropuestaGenerada } from "../types/models";

export async function listarPropuestas(idEstudiante: number): Promise<PropuestaGenerada[]> {
  return propuestaRepo.listarPropuestasPorEstudiante(idEstudiante);
}

export async function obtenerPropuesta(
  idPropuesta: number,
  idEstudiante: number
): Promise<PropuestaGenerada> {
  const propuesta = await propuestaRepo.buscarPropuestaDeEstudiante(idPropuesta, idEstudiante);
  if (!propuesta) {
    throw new AppError("La propuesta solicitada no existe.", 404);
  }
  return propuesta;
}

// Genera un texto plano descargable con el contenido de la propuesta.
// (La exportacion a PDF/Word se puede añadir mas adelante desde el frontend.)
export function generarTextoDescargable(propuesta: PropuestaGenerada): string {
  return [
    "PROPUESTA PRELIMINAR DE TESIS",
    "================================",
    "",
    `Tema 1: ${propuesta.propuesta_tema_1}`,
    propuesta.propuesta_tema_2 ? `Tema 2: ${propuesta.propuesta_tema_2}` : null,
    propuesta.propuesta_tema_3 ? `Tema 3: ${propuesta.propuesta_tema_3}` : null,
    "",
    "Planteamiento del problema:",
    propuesta.planteamiento_problema,
    "",
    "Objetivo general:",
    propuesta.objetivo_general,
    "",
    "Objetivos específicos:",
    propuesta.objetivos_especificos,
    "",
    "Justificación:",
    propuesta.justificacion,
    "",
    `Estado: ${propuesta.estado}`,
    `Fecha de generación: ${propuesta.fecha_generacion}`,
  ]
    .filter((linea) => linea !== null)
    .join("\n");
}
