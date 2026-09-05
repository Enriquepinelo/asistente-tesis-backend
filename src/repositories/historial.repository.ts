import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../config/db";
import { HistorialFlujo, EstadoFlujo } from "../types/models";

const CAMPOS = [
  "h.id_historial",
  "h.id_formulario",
  "h.id_propuesta",
  "h.identificador_solicitud",
  "h.nombre_flujo",
  "h.estado_flujo",
  "h.mensaje",
  "h.tiempo_respuesta_ms",
  "h.fecha_ejecucion",
].join(", ");

// El historial se filtra por los formularios del estudiante autenticado.
export async function listarHistorialPorEstudiante(idEstudiante: number): Promise<HistorialFlujo[]> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT ${CAMPOS} FROM historial_flujos h
     JOIN formularios_tesis f ON f.id_formulario = h.id_formulario
     WHERE f.id_estudiante = ?
     ORDER BY h.fecha_ejecucion DESC`,
    [idEstudiante]
  );
  return filas as HistorialFlujo[];
}

export async function contarHistorialPorEstudianteYEstado(
  idEstudiante: number
): Promise<Record<EstadoFlujo, number>> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT h.estado_flujo, COUNT(*) AS total FROM historial_flujos h
     JOIN formularios_tesis f ON f.id_formulario = h.id_formulario
     WHERE f.id_estudiante = ?
     GROUP BY h.estado_flujo`,
    [idEstudiante]
  );

  const resumen: Record<string, number> = {
    exitoso: 0,
    fallido: 0,
    validacion_error: 0,
    ia_error: 0,
    bd_error: 0,
  };
  for (const fila of filas as { estado_flujo: EstadoFlujo; total: number }[]) {
    resumen[fila.estado_flujo] = Number(fila.total);
  }
  return resumen as Record<EstadoFlujo, number>;
}

// Registra un evento en historial_flujos. Lo usa el backend, por ejemplo,
// cuando el webhook de n8n no responde (para no perder trazabilidad del error).
export async function registrarEventoHistorial(datos: {
  id_formulario: number | null;
  id_propuesta: number | null;
  identificador_solicitud: string;
  nombre_flujo: string;
  estado_flujo: EstadoFlujo;
  mensaje?: string | null;
  tiempo_respuesta_ms?: number | null;
}): Promise<number> {
  const [resultado] = await pool.query<ResultSetHeader>(
    `INSERT INTO historial_flujos
      (id_formulario, id_propuesta, identificador_solicitud, nombre_flujo, estado_flujo, mensaje, tiempo_respuesta_ms)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      datos.id_formulario,
      datos.id_propuesta,
      datos.identificador_solicitud,
      datos.nombre_flujo,
      datos.estado_flujo,
      datos.mensaje ?? null,
      datos.tiempo_respuesta_ms ?? null,
    ]
  );
  return resultado.insertId;
}
