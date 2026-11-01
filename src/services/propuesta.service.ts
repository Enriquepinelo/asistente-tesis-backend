import { AppError } from "../utils/AppError";
import * as envioRepo from "../repositories/envio.repository";
import * as propuestaRepo from "../repositories/propuesta.repository";
import { PropuestaGenerada, EstadoPropuesta } from "../types/models";

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

// ---- Personal academico ----
// Cada propuesta llega con las observaciones que el asesor ya escribio.
export async function listarTodas() {
  const [propuestas, observaciones] = await Promise.all([
    propuestaRepo.listarTodasLasPropuestas(),
    propuestaRepo.listarObservacionesAsesor(),
  ]);
  return propuestas.map((p) => ({
    ...p,
    observaciones: observaciones.filter((o) => o.id_formulario === p.id_formulario),
  }));
}

export async function obtenerPropuestaParaPersonal(idPropuesta: number): Promise<PropuestaGenerada> {
  const propuesta = await propuestaRepo.buscarPropuestaPorId(idPropuesta);
  if (!propuesta) throw new AppError("La propuesta solicitada no existe.", 404);
  return propuesta;
}

export async function cambiarEstado(
  idPropuesta: number,
  estado: EstadoPropuesta,
  comentario: string | null
): Promise<void> {
  if (estado === "ajustada" && !comentario) {
    throw new AppError("Escriba qué debe ajustar el estudiante.", 400);
  }
  const ok = await propuestaRepo.revisarPropuesta(idPropuesta, estado, comentario);
  if (!ok) throw new AppError("La propuesta solicitada no existe.", 404);
}

// ---- Envío a revisión (lo decide el estudiante) ----
const PREFIJO_DESARROLLO = "Desarrollar el anteproyecto del tema:";

export async function enviarARevision(idFormulario: number, idEstudiante: number, mensaje: string | null) {
  const propuesta = await envioRepo.buscarPorFormulario(idFormulario, idEstudiante);
  if (!propuesta) throw new AppError("No se encontró tu propuesta.", 404);
  if (!(propuesta.objetivo_proyecto ?? "").startsWith(PREFIJO_DESARROLLO)) {
    throw new AppError("Primero elige uno de los temas y genera su desarrollo; eso es lo que se envía al asesor.", 400);
  }
  if (propuesta.id_envio && propuesta.estado !== "ajustada") {
    throw new AppError("Esta propuesta ya fue enviada a tu asesor.", 409);
  }
  await envioRepo.registrarEnvio(propuesta.id_propuesta, mensaje, propuesta.veces ?? 0);
  return { id_propuesta: propuesta.id_propuesta, reenvio: !!propuesta.id_envio };
}

export async function enviosRecientes() {
  return envioRepo.listarRecientes();
}
