import { RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import { RecomendacionApoyo } from "../types/models";

const CAMPOS = [
  "r.id_recomendacion",
  "r.id_formulario",
  "r.tipo_recomendacion",
  "r.contenido",
  "r.fuente",
  "r.fecha_creacion",
].join(", ");

export async function listarRecomendacionesPorEstudiante(
  idEstudiante: number
): Promise<RecomendacionApoyo[]> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT ${CAMPOS} FROM recomendaciones_apoyo r
     JOIN formularios_tesis f ON f.id_formulario = r.id_formulario
     WHERE f.id_estudiante = ?
     ORDER BY r.fecha_creacion DESC`,
    [idEstudiante]
  );
  return filas as RecomendacionApoyo[];
}

export async function contarRecomendacionesPorEstudiante(idEstudiante: number): Promise<number> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM recomendaciones_apoyo r
     JOIN formularios_tesis f ON f.id_formulario = r.id_formulario
     WHERE f.id_estudiante = ?`,
    [idEstudiante]
  );
  return Number((filas[0] as { total: number }).total);
}
