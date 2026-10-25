import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../config/db";
import { PropuestaGenerada, EstadoPropuesta } from "../types/models";

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

// ---- Vista del personal academico (asesor, coordinador, administrador) ----
// Incluye el nombre del estudiante para que el asesor sepa de quien es cada propuesta.
const CAMPOS_PERSONAL = `${CAMPOS}, e.nombre_completo AS nombre_estudiante, e.carnet, f.area_interes`;

export async function listarTodasLasPropuestas(): Promise<PropuestaGenerada[]> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT ${CAMPOS_PERSONAL} FROM propuestas_generadas p
     JOIN formularios_tesis f ON f.id_formulario = p.id_formulario
     JOIN estudiantes e ON e.id_estudiante = f.id_estudiante
     ORDER BY p.fecha_generacion DESC`
  );
  return filas as PropuestaGenerada[];
}

export async function buscarPropuestaPorId(idPropuesta: number): Promise<PropuestaGenerada | null> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT ${CAMPOS_PERSONAL} FROM propuestas_generadas p
     JOIN formularios_tesis f ON f.id_formulario = p.id_formulario
     JOIN estudiantes e ON e.id_estudiante = f.id_estudiante
     WHERE p.id_propuesta = ? LIMIT 1`,
    [idPropuesta]
  );
  return (filas[0] as PropuestaGenerada) ?? null;
}

export async function actualizarEstadoPropuesta(idPropuesta: number, estado: EstadoPropuesta): Promise<boolean> {
  const [resultado] = await pool.query<ResultSetHeader>(
    "UPDATE propuestas_generadas SET estado = ? WHERE id_propuesta = ?",
    [estado, idPropuesta]
  );
  return resultado.affectedRows > 0;
}

// Cambia el estado y, si el asesor escribio una observacion, la guarda en
// recomendaciones_apoyo (fuente "asesor") para que el estudiante la vea.
// Se hace en una transaccion: o se guardan ambas cosas o ninguna.
export async function revisarPropuesta(
  idPropuesta: number,
  estado: EstadoPropuesta,
  comentario: string | null
): Promise<boolean> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    const [filas] = await conexion.query<RowDataPacket[]>(
      "SELECT id_formulario FROM propuestas_generadas WHERE id_propuesta = ? LIMIT 1",
      [idPropuesta]
    );
    if (filas.length === 0) {
      await conexion.rollback();
      return false;
    }
    await conexion.query("UPDATE propuestas_generadas SET estado = ? WHERE id_propuesta = ?", [estado, idPropuesta]);
    if (comentario) {
      await conexion.query(
        "INSERT INTO recomendaciones_apoyo (id_formulario, tipo_recomendacion, contenido, fuente) VALUES (?, ?, ?, 'asesor')",
        [filas[0].id_formulario, `Revisión del asesor: ${estado}`, comentario]
      );
    }
    await conexion.commit();
    return true;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// Observaciones del asesor sobre los formularios de las propuestas (vista del personal).
export async function listarObservacionesAsesor(): Promise<RowDataPacket[]> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT id_recomendacion, id_formulario, tipo_recomendacion, contenido, fecha_creacion
     FROM recomendaciones_apoyo WHERE fuente = 'asesor' ORDER BY fecha_creacion DESC`
  );
  return filas;
}
