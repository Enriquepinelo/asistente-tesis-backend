import { RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import { Estudiante } from "../types/models";

// El vinculo entre usuarios_sistema y estudiantes se hace por correo
// (decision de diseño de Fase 1: no hay FK entre ambas tablas).
export async function buscarEstudiantePorCorreo(correo: string): Promise<Estudiante | null> {
  const [filas] = await pool.query<RowDataPacket[]>(
    "SELECT id_estudiante, nombre_completo, correo, carnet, carrera, sede, fecha_registro, estado " +
      "FROM estudiantes WHERE correo = ? LIMIT 1",
    [correo]
  );
  return (filas[0] as Estudiante) ?? null;
}

export async function buscarEstudiantePorId(idEstudiante: number): Promise<Estudiante | null> {
  const [filas] = await pool.query<RowDataPacket[]>(
    "SELECT id_estudiante, nombre_completo, correo, carnet, carrera, sede, fecha_registro, estado " +
      "FROM estudiantes WHERE id_estudiante = ? LIMIT 1",
    [idEstudiante]
  );
  return (filas[0] as Estudiante) ?? null;
}
