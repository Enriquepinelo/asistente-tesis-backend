import { RowDataPacket } from "mysql2";
import { pool } from "../config/db";
import { UsuarioSistema } from "../types/models";

// Todas las consultas usan "?" como placeholder (parametrizadas).
// Nunca se concatena texto del usuario directamente en el SQL.
export async function buscarUsuarioPorCorreo(correo: string): Promise<UsuarioSistema | null> {
  const [filas] = await pool.query<RowDataPacket[]>(
    "SELECT id_usuario, nombre_usuario, correo, contrasena_hash, rol, estado, fecha_creacion " +
      "FROM usuarios_sistema WHERE correo = ? LIMIT 1",
    [correo]
  );
  return (filas[0] as UsuarioSistema) ?? null;
}

export async function buscarUsuarioPorId(idUsuario: number): Promise<UsuarioSistema | null> {
  const [filas] = await pool.query<RowDataPacket[]>(
    "SELECT id_usuario, nombre_usuario, correo, contrasena_hash, rol, estado, fecha_creacion " +
      "FROM usuarios_sistema WHERE id_usuario = ? LIMIT 1",
    [idUsuario]
  );
  return (filas[0] as UsuarioSistema) ?? null;
}
