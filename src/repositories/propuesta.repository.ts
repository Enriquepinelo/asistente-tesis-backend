import { RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import { PropuestaGenerada } from "../types/models";

const CAMPOS = [
  "p.id_propuesta",
  "p.id_formulario",
  "p.propuesta_tema_1",
  "p.propuesta_tema_2",
  "p.propuesta_tema_3",
  "p.planteamiento_problema",
  "p.objetivo_general",
  "p.objetivos_especificos",
  "p.justificacion",
  "p.modelo_ia",
  "p.fecha_generacion",
  "p.version",
  "p.estado",
].join(", ");

// Solo devuelve propuestas cuyo formulario pertenece al estudiante indicado
// (join contra formularios_tesis para aislar datos por usuario).
export async function listarPropuestasPorEstudiante(idEstudiante: number): Promise<PropuestaGenerada[]> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT ${CAMPOS} FROM propuestas_generadas p
     JOIN formularios_tesis f ON f.id_formulario = p.id_formulario
     WHERE f.id_estudiante = ?
     ORDER BY p.fecha_generacion DESC`,
    [idEstudiante]
  );
  return filas as PropuestaGenerada[];
}

export async function buscarPropuestaDeEstudiante(
  idPropuesta: number,
  idEstudiante: number
): Promise<PropuestaGenerada | null> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT ${CAMPOS} FROM propuestas_generadas p
     JOIN formularios_tesis f ON f.id_formulario = p.id_formulario
     WHERE p.id_propuesta = ? AND f.id_estudiante = ?
     LIMIT 1`,
    [idPropuesta, idEstudiante]
  );
  return (filas[0] as PropuestaGenerada) ?? null;
}

export async function contarPropuestasPorEstudiante(idEstudiante: number): Promise<number> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM propuestas_generadas p
     JOIN formularios_tesis f ON f.id_formulario = p.id_formulario
     WHERE f.id_estudiante = ?`,
    [idEstudiante]
  );
  return Number((filas[0] as { total: number }).total);
}
