import { Prioridad } from "../types/models";

// La tabla recomendaciones_apoyo NO tiene columna de prioridad.
// Por decision del usuario (Fase 1), la prioridad se deriva aqui,
// en el backend, segun el tipo_recomendacion, sin modificar la base de datos.
//
// Ajusta este mapeo libremente si tu asesor pide otros criterios;
// es el UNICO lugar del sistema donde se define esta regla.
const MAPA_PRIORIDAD: Record<string, Prioridad> = {
  "Asesoría con el tutor": "alta",
  "Metodología de investigación": "alta",
  "Revisión bibliográfica": "media",
  "Cronograma de actividades": "media",
  "Definición del alcance": "media",
  "Instrumento de medición": "baja",
};

export function calcularPrioridad(tipoRecomendacion: string): Prioridad {
  return MAPA_PRIORIDAD[tipoRecomendacion] ?? "baja";
}
