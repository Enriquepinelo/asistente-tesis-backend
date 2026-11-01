import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../config/db";

// Envíos a revisión: la propuesta que genera la IA queda como borrador del
// estudiante y solo le llega al asesor cuando el estudiante la envía.
// La tabla se crea sola la primera vez. Las propuestas que ya existían antes
// de este cambio se marcan como enviadas para que el asesor no las pierda.

let lista: Promise<void> | null = null;

export function asegurarTablaEnvios(): Promise<void> {
  if (!lista) {
    lista = (async () => {
      const [existe] = await pool.query<RowDataPacket[]>(
        `SELECT 1 FROM information_schema.tables
         WHERE table_schema = DATABASE() AND table_name = 'envios_revision' LIMIT 1`
      );
      if (existe.length > 0) return;
      await pool.query(
        `CREATE TABLE IF NOT EXISTS envios_revision (
           id_envio     INT AUTO_INCREMENT PRIMARY KEY,
           id_propuesta INT NOT NULL,
           mensaje      VARCHAR(1000) NULL,
           veces        INT NOT NULL DEFAULT 1,
           fecha_envio  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
           UNIQUE KEY uq_envio_propuesta (id_propuesta),
           CONSTRAINT fk_envio_propuesta FOREIGN KEY (id_propuesta)
             REFERENCES propuestas_generadas (id_propuesta) ON DELETE CASCADE
         ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
      );
      await pool.query(
        `INSERT IGNORE INTO envios_revision (id_propuesta, fecha_envio)
         SELECT p.id_propuesta, p.fecha_generacion FROM propuestas_generadas p
         JOIN formularios_tesis f ON f.id_formulario = p.id_formulario
         WHERE f.objetivo_proyecto LIKE 'Desarrollar el anteproyecto del tema:%'`
      );
    })().catch((error) => {
      lista = null; // se vuelve a intentar en la siguiente petición
      throw error;
    });
  }
  return lista;
}

export interface PropuestaParaEnvio {
  id_propuesta: number;
  estado: string;
  objetivo_proyecto: string | null;
  id_envio: number | null;
  veces: number | null;
}

// Busca la propuesta de ese formulario, solo si pertenece al estudiante.
export async function buscarPorFormulario(idFormulario: number, idEstudiante: number): Promise<PropuestaParaEnvio | null> {
  await asegurarTablaEnvios();
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT p.id_propuesta, p.estado, f.objetivo_proyecto, env.id_envio, env.veces
     FROM propuestas_generadas p
     JOIN formularios_tesis f ON f.id_formulario = p.id_formulario
     LEFT JOIN envios_revision env ON env.id_propuesta = p.id_propuesta
     WHERE p.id_formulario = ? AND f.id_estudiante = ?
     ORDER BY p.id_propuesta DESC LIMIT 1`,
    [idFormulario, idEstudiante]
  );
  return (filas[0] as PropuestaParaEnvio) ?? null;
}

// Registra el envío. Si se reenvía (después de "con ajustes"), se reemplaza el
// registro para que el asesor reciba el aviso otra vez y la propuesta vuelve a "por revisar".
export async function registrarEnvio(idPropuesta: number, mensaje: string | null, vecesAnteriores: number) {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    await conexion.query("DELETE FROM envios_revision WHERE id_propuesta = ?", [idPropuesta]);
    const [r] = await conexion.query<ResultSetHeader>(
      "INSERT INTO envios_revision (id_propuesta, mensaje, veces) VALUES (?, ?, ?)",
      [idPropuesta, mensaje, vecesAnteriores + 1]
    );
    await conexion.query("UPDATE propuestas_generadas SET estado = 'generada' WHERE id_propuesta = ?", [idPropuesta]);
    await conexion.commit();
    return r.insertId;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

// Envíos recientes, para avisarle al asesor.
export async function listarRecientes() {
  await asegurarTablaEnvios();
  const [filas] = await pool.query<RowDataPacket[]>(
    `SELECT env.id_envio, env.id_propuesta, env.mensaje, env.veces, env.fecha_envio,
            e.nombre_completo AS nombre_estudiante, p.propuesta_tema_1 AS tema, f.objetivo_proyecto
     FROM envios_revision env
     JOIN propuestas_generadas p ON p.id_propuesta = env.id_propuesta
     JOIN formularios_tesis f ON f.id_formulario = p.id_formulario
     LEFT JOIN estudiantes e ON e.id_estudiante = f.id_estudiante
     WHERE f.objetivo_proyecto LIKE 'Desarrollar el anteproyecto del tema:%'
     ORDER BY env.id_envio DESC LIMIT 100`
  );
  return filas;
}
