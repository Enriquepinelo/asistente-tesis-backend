import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../config/db";

// Documentos de revision (tabla documentos_revision). El contenido se guarda
// en la base de datos porque el disco de Render (plan gratuito) se borra al reiniciar.

export async function crearDocumento(d: {
  id_propuesta: number;
  nombre_archivo: string;
  tipo_mime: string;
  contenido: Buffer;
  subido_por: number;
}): Promise<number> {
  const [r] = await pool.query<ResultSetHeader>(
    `INSERT INTO documentos_revision (id_propuesta, nombre_archivo, tipo_mime, tamano_bytes, contenido, subido_por)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [d.id_propuesta, d.nombre_archivo, d.tipo_mime, d.contenido.length, d.contenido, d.subido_por]
  );
  return r.insertId;
}

export async function listarPorPropuesta(idPropuesta: number) {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT d.id_documento, d.id_propuesta, d.nombre_archivo, d.tipo_mime, d.tamano_bytes, d.fecha_subida,
            u.nombre_usuario AS subido_por
     FROM documentos_revision d LEFT JOIN usuarios_sistema u ON u.id_usuario = d.subido_por
     WHERE d.id_propuesta = ? ORDER BY d.fecha_subida DESC`,
    [idPropuesta]
  );
  return filas;
}

export async function obtenerDocumento(idDocumento: number) {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT d.id_documento, d.id_propuesta, d.nombre_archivo, d.tipo_mime, d.contenido, f.id_estudiante
     FROM documentos_revision d
     JOIN propuestas_generadas p ON p.id_propuesta = d.id_propuesta
     JOIN formularios_tesis f ON f.id_formulario = p.id_formulario
     WHERE d.id_documento = ? LIMIT 1`,
    [idDocumento]
  );
  return filas[0] ?? null;
}

export async function estudianteDePropuesta(idPropuesta: number): Promise<number | null> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT f.id_estudiante FROM propuestas_generadas p
     JOIN formularios_tesis f ON f.id_formulario = p.id_formulario
     WHERE p.id_propuesta = ? LIMIT 1`,
    [idPropuesta]
  );
  return filas[0] ? Number(filas[0].id_estudiante) : null;
}
