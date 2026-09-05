import * as formularioRepo from "../repositories/formulario.repository";
import * as propuestaRepo from "../repositories/propuesta.repository";
import * as recomendacionRepo from "../repositories/recomendacion.repository";
import * as historialRepo from "../repositories/historial.repository";

export async function obtenerResumenDashboard(idEstudiante: number) {
  const [formularios, propuestas, recomendaciones] = await Promise.all([
    formularioRepo.contarFormulariosPorEstudiante(idEstudiante),
    propuestaRepo.contarPropuestasPorEstudiante(idEstudiante),
    recomendacionRepo.contarRecomendacionesPorEstudiante(idEstudiante),
  ]);

  return {
    formularios_enviados: formularios,
    propuestas_generadas: propuestas,
    recomendaciones_apoyo: recomendaciones,
  };
}

export async function obtenerActividadReciente(idEstudiante: number, limite = 10) {
  const historial = await historialRepo.listarHistorialPorEstudiante(idEstudiante);
  return historial.slice(0, limite);
}
