import { RowDataPacket } from "mysql2";
import { pool } from "../config/db";

// Consultas de solo lectura para el panel de coordinacion.
// Todas usan parametros (?) y ninguna modifica la estructura de la base.

const FORMULARIO_PROCESADO =
  "CASE WHEN EXISTS (SELECT 1 FROM propuestas_generadas p WHERE p.id_formulario = f.id_formulario) THEN 'procesado' ELSE f.estado END";

export async function propuestasPorEstado() {
  const [filas] = await pool.query<RowDataPacket[]>(
    "SELECT estado, COUNT(*) AS total FROM propuestas_generadas GROUP BY estado"
  );
  return filas.map((f) => ({ estado: f.estado as string, total: Number(f.total) }));
}

export async function formulariosPorEstado() {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT ${FORMULARIO_PROCESADO} AS estado, COUNT(*) AS total FROM formularios_tesis f GROUP BY 1`
  );
  return filas.map((f) => ({ estado: f.estado as string, total: Number(f.total) }));
}

export async function areasMasSolicitadas(limite = 8) {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT LOWER(TRIM(area_interes)) AS area, COUNT(*) AS total
     FROM formularios_tesis GROUP BY LOWER(TRIM(area_interes))
     ORDER BY total DESC LIMIT ?`,
    [limite]
  );
  return filas.map((f) => ({ area: f.area as string, total: Number(f.total) }));
}

// Rendimiento del flujo de IA (se excluye el guardado de borradores, que no usa IA).
export async function rendimientoIA() {
  const [porEstado] = await pool.query<RowDataPacket[]>(
    `SELECT estado_flujo, COUNT(*) AS total,
            AVG(CASE WHEN estado_flujo = 'exitoso' THEN tiempo_respuesta_ms END) AS promedio_ms
     FROM historial_flujos
     WHERE nombre_flujo <> 'Guardar borrador de formulario'
     GROUP BY estado_flujo`
  );
  const [errores] = await pool.query<RowDataPacket[]>(
    `SELECT fecha_ejecucion, estado_flujo, mensaje
     FROM historial_flujos
     WHERE estado_flujo <> 'exitoso' AND nombre_flujo <> 'Guardar borrador de formulario'
     ORDER BY fecha_ejecucion DESC LIMIT 5`
  );
  const [promedio] = await pool.query<RowDataPacket[]>(
    `SELECT AVG(tiempo_respuesta_ms) AS promedio_ms FROM historial_flujos
     WHERE estado_flujo = 'exitoso' AND tiempo_respuesta_ms IS NOT NULL
       AND nombre_flujo <> 'Guardar borrador de formulario'`
  );
  return {
    por_estado: porEstado.map((f) => ({ estado: f.estado_flujo as string, total: Number(f.total) })),
    tiempo_promedio_ms: promedio[0]?.promedio_ms != null ? Math.round(Number(promedio[0].promedio_ms)) : null,
    ultimos_errores: errores.map((e) => ({ fecha: e.fecha_ejecucion, estado: e.estado_flujo, mensaje: e.mensaje })),
  };
}

// Una fila por estudiante con su avance.
export async function listarEstudiantes() {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT e.id_estudiante, e.nombre_completo, e.correo, e.carnet, e.carrera, e.sede, e.fecha_registro,
            u.estado AS estado_cuenta,
            (SELECT COUNT(*) FROM formularios_tesis f WHERE f.id_estudiante = e.id_estudiante) AS formularios,
            (SELECT COUNT(*) FROM propuestas_generadas p JOIN formularios_tesis f ON f.id_formulario = p.id_formulario
               WHERE f.id_estudiante = e.id_estudiante) AS propuestas,
            (SELECT COUNT(*) FROM propuestas_generadas p JOIN formularios_tesis f ON f.id_formulario = p.id_formulario
               WHERE f.id_estudiante = e.id_estudiante AND p.estado = 'generada') AS por_revisar,
            (SELECT COUNT(*) FROM propuestas_generadas p JOIN formularios_tesis f ON f.id_formulario = p.id_formulario
               WHERE f.id_estudiante = e.id_estudiante AND p.estado = 'ajustada') AS ajustadas,
            (SELECT COUNT(*) FROM propuestas_generadas p JOIN formularios_tesis f ON f.id_formulario = p.id_formulario
               WHERE f.id_estudiante = e.id_estudiante AND p.estado = 'aprobada') AS aprobadas,
            (SELECT MAX(f.fecha_creacion) FROM formularios_tesis f WHERE f.id_estudiante = e.id_estudiante) AS ultima_actividad
     FROM estudiantes e
     LEFT JOIN usuarios_sistema u ON u.correo = e.correo
     ORDER BY ultima_actividad IS NULL, ultima_actividad DESC, e.nombre_completo`
  );
  return filas.map((f) => ({
    ...f,
    formularios: Number(f.formularios),
    propuestas: Number(f.propuestas),
    por_revisar: Number(f.por_revisar),
    ajustadas: Number(f.ajustadas),
    aprobadas: Number(f.aprobadas),
  }));
}

// Detalle de un estudiante: sus propuestas con las observaciones del asesor.
export async function detalleEstudiante(idEstudiante: number) {
  const [est] = await pool.query<RowDataPacket[]>(
    "SELECT id_estudiante, nombre_completo, correo, carnet, carrera, sede FROM estudiantes WHERE id_estudiante = ? LIMIT 1",
    [idEstudiante]
  );
  if (est.length === 0) return null;
  const [propuestas] = await pool.query<RowDataPacket[]>(
    `SELECT p.id_propuesta, p.id_formulario, p.propuesta_tema_1, p.estado, p.fecha_generacion, f.area_interes
     FROM propuestas_generadas p JOIN formularios_tesis f ON f.id_formulario = p.id_formulario
     WHERE f.id_estudiante = ? ORDER BY p.fecha_generacion DESC, p.id_propuesta DESC`,
    [idEstudiante]
  );
  const [obs] = await pool.query<RowDataPacket[]>(
    `SELECT r.id_formulario, r.contenido, r.fecha_creacion
     FROM recomendaciones_apoyo r JOIN formularios_tesis f ON f.id_formulario = r.id_formulario
     WHERE f.id_estudiante = ? AND r.fuente = 'asesor' ORDER BY r.fecha_creacion DESC`,
    [idEstudiante]
  );
  return {
    estudiante: est[0],
    propuestas: propuestas.map((p) => ({ ...p, observaciones: obs.filter((o) => o.id_formulario === p.id_formulario) })),
  };
}

export async function cuentasPendientes() {
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT u.id_usuario, u.correo, u.fecha_creacion, e.nombre_completo, e.carnet, e.carrera, e.sede
     FROM usuarios_sistema u LEFT JOIN estudiantes e ON e.correo = u.correo
     WHERE u.rol = 'estudiante' AND u.estado = 'inactivo'
     ORDER BY u.fecha_creacion DESC`
  );
  return filas;
}

// Solo activa cuentas con rol estudiante (el coordinador no puede activar otros roles).
export async function activarCuentaEstudiante(idUsuario: number): Promise<boolean> {
  const [r] = await pool.query<any>(
    "UPDATE usuarios_sistema SET estado = 'activo' WHERE id_usuario = ? AND rol = 'estudiante'",
    [idUsuario]
  );
  return r.affectedRows > 0;
}
