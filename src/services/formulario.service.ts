import { AppError } from "../utils/AppError";
import * as formularioRepo from "../repositories/formulario.repository";
import * as historialRepo from "../repositories/historial.repository";
import * as estudianteRepo from "../repositories/estudiante.repository";
import { solicitarGeneracionDePropuestas } from "./n8n.service";
import { FormularioBorradorInput, FormularioGenerarPropuestaInput } from "../validators/formulario.validator";
import { FormularioTesis } from "../types/models";
import crypto from "crypto";

export async function listarFormularios(idEstudiante: number): Promise<FormularioTesis[]> {
  return formularioRepo.listarFormulariosPorEstudiante(idEstudiante);
}

export async function obtenerFormulario(
  idFormulario: number,
  idEstudiante: number
): Promise<FormularioTesis> {
  const formulario = await formularioRepo.buscarFormularioDeEstudiante(idFormulario, idEstudiante);
  if (!formulario) {
    throw new AppError("El formulario solicitado no existe.", 404);
  }
  return formulario;
}

// Crea o actualiza el formulario dejandolo en estado "borrador".
export async function guardarBorrador(
  idEstudiante: number,
  idFormulario: number | null,
  datos: FormularioBorradorInput
): Promise<FormularioTesis> {
  let idFinal = idFormulario;

  if (idFinal) {
    const existente = await formularioRepo.buscarFormularioDeEstudiante(idFinal, idEstudiante);
    if (!existente) {
      throw new AppError("El formulario solicitado no existe.", 404);
    }
    await formularioRepo.actualizarFormulario(idFinal, idEstudiante, datos, "borrador");
  } else {
    idFinal = await formularioRepo.crearFormulario(idEstudiante, datos, "borrador");
  }

  await historialRepo.registrarEventoHistorial({
    id_formulario: idFinal,
    id_propuesta: null,
    identificador_solicitud: crypto.randomUUID(),
    nombre_flujo: "Guardar borrador de formulario",
    estado_flujo: "exitoso",
    mensaje: "Formulario guardado como borrador.",
  });

  return formularioRepo.buscarFormularioDeEstudiante(idFinal, idEstudiante) as Promise<FormularioTesis>;
}

// Guarda/actualiza el formulario y solicita a n8n la generacion de propuestas.
export async function generarPropuesta(
  idEstudiante: number,
  idFormulario: number | null,
  datos: FormularioGenerarPropuestaInput
) {
  let idFinal = idFormulario;

  if (idFinal) {
    const existente = await formularioRepo.buscarFormularioDeEstudiante(idFinal, idEstudiante);
    if (!existente) {
      throw new AppError("El formulario solicitado no existe.", 404);
    }
    await formularioRepo.actualizarFormulario(idFinal, idEstudiante, datos, "borrador");
  } else {
    idFinal = await formularioRepo.crearFormulario(idEstudiante, datos, "borrador");
  }

  const identificadorSolicitud = crypto.randomUUID();
  const formulario = (await formularioRepo.buscarFormularioDeEstudiante(
    idFinal,
    idEstudiante
  )) as FormularioTesis;

  const estudiante = await estudianteRepo.buscarEstudiantePorId(idEstudiante);
  if (!estudiante) {
    throw new AppError("No se encontró la información del estudiante.", 404);
  }

  const inicio = Date.now();
  try {
    const resultado = await solicitarGeneracionDePropuestas(formulario, estudiante);
    // n8n ya actualiza formularios_tesis.estado y registra su propio historial
    // (pasos definidos en el workflow de la Fase 4). Aqui solo se retorna la respuesta.
    return resultado;
  } catch (error) {
    // Si el webhook no responde, dejamos constancia en el historial y marcamos
    // el formulario como "error", para que el estudiante sepa que algo fallo.
    await formularioRepo.actualizarEstadoFormulario(idFinal, "error");
    await historialRepo.registrarEventoHistorial({
      id_formulario: idFinal,
      id_propuesta: null,
      identificador_solicitud: identificadorSolicitud,
      nombre_flujo: "Generar propuestas y recomendaciones de tesis",
      estado_flujo: "fallido",
      mensaje: error instanceof Error ? error.message : "Error desconocido al contactar n8n.",
      tiempo_respuesta_ms: Date.now() - inicio,
    });
    throw new AppError(
      "No se pudo generar la propuesta en este momento. Intente nuevamente en unos minutos.",
      502
    );
  }
}
