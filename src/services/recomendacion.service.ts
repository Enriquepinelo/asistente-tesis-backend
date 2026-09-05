import * as recomendacionRepo from "../repositories/recomendacion.repository";
import { calcularPrioridad } from "../utils/prioridad";
import { RecomendacionApoyo, Prioridad } from "../types/models";

export interface RecomendacionConPrioridad extends RecomendacionApoyo {
  prioridad: Prioridad;
}

export async function listarRecomendaciones(
  idEstudiante: number,
  filtroPrioridad?: Prioridad
): Promise<RecomendacionConPrioridad[]> {
  const recomendaciones = await recomendacionRepo.listarRecomendacionesPorEstudiante(idEstudiante);

  const conPrioridad: RecomendacionConPrioridad[] = recomendaciones.map((r) => ({
    ...r,
    prioridad: calcularPrioridad(r.tipo_recomendacion),
  }));

  if (filtroPrioridad) {
    return conPrioridad.filter((r) => r.prioridad === filtroPrioridad);
  }
  return conPrioridad;
}
