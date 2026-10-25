import { RowDataPacket, ResultSetHeader } from "mysql2";
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

// ---- Gestion de usuarios (solo administrador) ----
// Nunca se devuelve contrasena_hash al listar.
export interface UsuarioListado {
  id_usuario: number;
  nombre_usuario: string;
  correo: string;
  rol: string;
  estado: string;
  fecha_creacion: string;
  nombre_completo: string | null;
}

export async function listarUsuarios(): Promise<UsuarioListado[]> {
  const [filas] = await pool.query<RowDataPacket[]>(
    "SELECT u.id_usuario, u.nombre_usuario, u.correo, u.rol, u.estado, u.fecha_creacion, " +
      "e.nombre_completo FROM usuarios_sistema u " +
      "LEFT JOIN estudiantes e ON e.correo = u.correo " +
      "ORDER BY (u.estado = 'inactivo') DESC, u.fecha_creacion DESC, u.id_usuario DESC"
  );
  return filas as UsuarioListado[];
}

export async function existeCorreoONombre(correo: string, nombreUsuario: string): Promise<{ correo: boolean; nombre: boolean }> {
  const [filas] = await pool.query<RowDataPacket[]>(
    "SELECT correo, nombre_usuario FROM usuarios_sistema WHERE correo = ? OR nombre_usuario = ?",
    [correo, nombreUsuario]
  );
  return {
    correo: filas.some((f) => f.correo === correo),
    nombre: filas.some((f) => f.nombre_usuario === nombreUsuario),
  };
}

export interface DatosEstudianteNuevo {
  nombre_completo: string;
  carnet: string;
  carrera: string;
  sede: string | null;
}

// Crea el usuario y, si es estudiante, tambien su registro en "estudiantes"
// (vinculados por correo). Se hace en una transaccion: o se guardan ambos o ninguno.
export async function crearUsuario(
  datos: { nombre_usuario: string; correo: string; contrasena_hash: string; rol: string },
  estudiante: DatosEstudianteNuevo | null,
  estado: "activo" | "inactivo" = "activo"
): Promise<number> {
  const conexion = await pool.getConnection();
  try {
    await conexion.beginTransaction();
    if (estudiante) {
      const [existe] = await conexion.query<RowDataPacket[]>(
        "SELECT id_estudiante FROM estudiantes WHERE correo = ? LIMIT 1",
        [datos.correo]
      );
      if (existe.length === 0) {
        await conexion.query(
          "INSERT INTO estudiantes (nombre_completo, correo, carnet, carrera, sede, estado) VALUES (?, ?, ?, ?, ?, 'activo')",
          [estudiante.nombre_completo, datos.correo, estudiante.carnet, estudiante.carrera, estudiante.sede]
        );
      }
    }
    const [resultado] = await conexion.query<ResultSetHeader>(
      "INSERT INTO usuarios_sistema (nombre_usuario, correo, contrasena_hash, rol, estado) VALUES (?, ?, ?, ?, ?)",
      [datos.nombre_usuario, datos.correo, datos.contrasena_hash, datos.rol, estado]
    );
    await conexion.commit();
    return resultado.insertId;
  } catch (error) {
    await conexion.rollback();
    throw error;
  } finally {
    conexion.release();
  }
}

export async function cambiarEstadoUsuario(idUsuario: number, estado: "activo" | "inactivo"): Promise<boolean> {
  const [resultado] = await pool.query<ResultSetHeader>(
    "UPDATE usuarios_sistema SET estado = ? WHERE id_usuario = ?",
    [estado, idUsuario]
  );
  return resultado.affectedRows > 0;
}

export async function existeNombreUsuario(nombre: string): Promise<boolean> {
  const [filas] = await pool.query<RowDataPacket[]>(
    "SELECT 1 FROM usuarios_sistema WHERE nombre_usuario = ? LIMIT 1",
    [nombre]
  );
  return filas.length > 0;
}
