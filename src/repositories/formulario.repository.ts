import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../config/db";
import { FormularioTesis, EstadoFormulario } from "../types/models";

const CAMPOS = [
  "id_formulario",
  "id_estudiante",
  "area_interes",
  "linea_investigacion",
  "tipo_problema",
  "descripcion_problema",
  "contexto",
  "poblacion_beneficiada",
  "objetivo_proyecto",
  "recursos_disponibles",
  "alcance_estimado",
  "observaciones",
  "fecha_creacion",
  "estado",
].join(", ");

// Lista SOLO los formularios del estudiante indicado (aislamiento por usuario).
export async function listarFormulariosPorEstudiante(idEstudiante: number): Promise<FormularioTesis[]> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT ${CAMPOS} FROM formularios_tesis WHERE id_estudiante = ? ORDER BY fecha_creacion DESC`,
    [idEstudiante]
  );
  return filas as FormularioTesis[];
}

// Busca un formulario por id, PERO solo si pertenece al estudiante indicado.
// Si el formulario existe pero es de otro estudiante, devuelve null
// (el controlador lo traduce en un 404, para no filtrar informacion).
export async function buscarFormularioDeEstudiante(
  idFormulario: number,
  idEstudiante: number
): Promise<FormularioTesis | null> {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT ${CAMPOS} FROM formularios_tesis WHERE id_formulario = ? AND id_estudiante = ? LIMIT 1`,
    [idFormulario, idEstudiante]
  );
  return (filas[0] as FormularioTesis) ?? null;
}

export interface DatosFormulario {
  area_interes: string;
  linea_investigacion?: string | null;
  tipo_problema?: string | null;
  descripcion_problema: string;
  contexto?: string | null;
  poblacion_beneficiada?: string | null;
  objetivo_proyecto?: string | null;
  recursos_disponibles?: string | null;
  alcance_estimado?: string | null;
  observaciones?: string | null;
}

export async function crearFormulario(
  idEstudiante: number,
  datos: DatosFormulario,
  estado: EstadoFormulario = "borrador"
): Promise<number> {
  const [resultado] = await pool.query<ResultSetHeader>(
    `INSERT INTO formularios_tesis
      (id_estudiante, area_interes, linea_investigacion, tipo_problema, descripcion_problema,
       contexto, poblacion_beneficiada, objetivo_proyecto, recursos_disponibles,
       alcance_estimado, observaciones, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      idEstudiante,
      datos.area_interes,
      datos.linea_investigacion ?? null,
      datos.tipo_problema ?? null,
      datos.descripcion_problema,
      datos.contexto ?? null,
      datos.poblacion_beneficiada ?? null,
      datos.objetivo_proyecto ?? null,
      datos.recursos_disponibles ?? null,
      datos.alcance_estimado ?? null,
      datos.observaciones ?? null,
      estado,
    ]
  );
  return resultado.insertId;
}

export async function actualizarFormulario(
  idFormulario: number,
  idEstudiante: number,
  datos: DatosFormulario,
  estado: EstadoFormulario
): Promise<boolean> {
  const [resultado] = await pool.query<ResultSetHeader>(
    `UPDATE formularios_tesis SET
       area_interes = ?, linea_investigacion = ?, tipo_problema = ?, descripcion_problema = ?,
       contexto = ?, poblacion_beneficiada = ?, objetivo_proyecto = ?, recursos_disponibles = ?,
       alcance_estimado = ?, observaciones = ?, estado = ?
     WHERE id_formulario = ? AND id_estudiante = ?`,
    [
      datos.area_interes,
      datos.linea_investigacion ?? null,
      datos.tipo_problema ?? null,
      datos.descripcion_problema,
      datos.contexto ?? null,
      datos.poblacion_beneficiada ?? null,
      datos.objetivo_proyecto ?? null,
      datos.recursos_disponibles ?? null,
      datos.alcance_estimado ?? null,
      datos.observaciones ?? null,
      estado,
      idFormulario,
      idEstudiante,
    ]
  );
  return resultado.affectedRows > 0;
}

export async function actualizarEstadoFormulario(
  idFormulario: number,
  estado: EstadoFormulario
): Promise<void> {
  await pool.query("UPDATE formularios_tesis SET estado = ? WHERE id_formulario = ?", [
    estado,
    idFormulario,
  ]);
}

export async function contarFormulariosPorEstudiante(idEstudiante: number): Promise<number> {
  const [filas] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) AS total FROM formularios_tesis WHERE id_estudiante = ?",
    [idEstudiante]
  );
  return Number((filas[0] as { total: number }).total);
}
