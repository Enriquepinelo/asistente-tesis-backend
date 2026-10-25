import bcrypt from "bcrypt";
import crypto from "crypto";
import { pool } from "../config/db";
import { buscarEstudiantePorCorreo } from "../repositories/estudiante.repository";
import { AppError } from "../utils/AppError";
import * as usuarioRepo from "../repositories/usuario.repository";
import { CrearUsuarioInput, RegistroEstudianteInput } from "../validators/usuario.validator";

const RONDAS_BCRYPT = 10;

export function listarUsuarios() {
  return usuarioRepo.listarUsuarios();
}

export async function crearUsuario(datos: CrearUsuarioInput) {
  const duplicado = await usuarioRepo.existeCorreoONombre(datos.correo, datos.nombre_usuario);
  if (duplicado.correo) throw new AppError("Ya existe un usuario con ese correo.", 409);
  if (duplicado.nombre) throw new AppError("Ese nombre de usuario ya está en uso.", 409);

  // La contrasena nunca se guarda en texto plano: solo su hash bcrypt.
  const contrasena_hash = await bcrypt.hash(datos.contrasena, RONDAS_BCRYPT);

  const estudiante =
    datos.rol === "estudiante"
      ? {
          nombre_completo: datos.nombre_completo as string,
          carnet: datos.carnet as string,
          carrera: datos.carrera as string,
          sede: datos.sede || null,
        }
      : null;

  try {
    const id = await usuarioRepo.crearUsuario(
      { nombre_usuario: datos.nombre_usuario, correo: datos.correo, contrasena_hash, rol: datos.rol },
      estudiante
    );
    return { id_usuario: id, nombre_usuario: datos.nombre_usuario, correo: datos.correo, rol: datos.rol, estado: "activo" };
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") {
      throw new AppError("El correo o el carnet ya están registrados.", 409);
    }
    throw error;
  }
}

export async function cambiarEstado(idUsuario: number, estado: "activo" | "inactivo", idAdmin: number) {
  if (idUsuario === idAdmin && estado === "inactivo") {
    throw new AppError("No puede desactivar su propia cuenta.", 400);
  }
  const ok = await usuarioRepo.cambiarEstadoUsuario(idUsuario, estado);
  if (!ok) throw new AppError("El usuario no existe.", 404);
}

// El estudiante crea su propia cuenta; queda inactiva hasta que el administrador la apruebe.
export async function registrarEstudiante(datos: RegistroEstudianteInput) {
  const base = datos.correo.split("@")[0].replace(/[^a-z0-9._]/g, "").slice(0, 40) || "estudiante";
  let nombreUsuario = base;
  for (let i = 2; await usuarioRepo.existeNombreUsuario(nombreUsuario); i++) {
    nombreUsuario = `${base}${i}`;
  }

  const duplicado = await usuarioRepo.existeCorreoONombre(datos.correo, nombreUsuario);
  if (duplicado.correo) throw new AppError("Ya existe una cuenta con ese correo.", 409);

  const contrasena_hash = await bcrypt.hash(datos.contrasena, RONDAS_BCRYPT);
  try {
    await usuarioRepo.crearUsuario(
      { nombre_usuario: nombreUsuario, correo: datos.correo, contrasena_hash, rol: "estudiante" },
      { nombre_completo: datos.nombre_completo, carnet: datos.carnet, carrera: datos.carrera, sede: datos.sede || null },
      "inactivo"
    );
  } catch (error: any) {
    if (error?.code === "ER_DUP_ENTRY") throw new AppError("El correo o el carnet ya están registrados.", 409);
    throw error;
  }
}

const ROLES = ["estudiante", "asesor", "coordinador", "administrador"];

export async function cambiarRol(idUsuario: number, rol: string, idAdmin: number) {
  if (!ROLES.includes(rol)) throw new AppError("El rol no es válido.", 400);
  if (idUsuario === idAdmin) throw new AppError("No puede cambiar el rol de su propia cuenta.", 400);
  const usuario = await usuarioRepo.buscarUsuarioPorId(idUsuario);
  if (!usuario) throw new AppError("El usuario no existe.", 404);
  // Un estudiante necesita su registro en la tabla estudiantes para generar propuestas.
  if (rol === "estudiante" && !(await buscarEstudiantePorCorreo(usuario.correo))) {
    throw new AppError("Para que sea estudiante, créelo como estudiante con su carnet y carrera.", 400);
  }
  await usuarioRepo.cambiarRolUsuario(idUsuario, rol);
}

// Genera una contraseña temporal legible (sin caracteres que se confundan) y la guarda cifrada.
// Se devuelve una sola vez para que el administrador se la entregue al usuario.
export async function restablecerContrasena(idUsuario: number): Promise<string> {
  const usuario = await usuarioRepo.buscarUsuarioPorId(idUsuario);
  if (!usuario) throw new AppError("El usuario no existe.", 404);
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = crypto.randomBytes(10);
  let temporal = "";
  for (const b of bytes) temporal += letras[b % letras.length];
  temporal = temporal.slice(0, 8) + "*" + (bytes[9] % 10);
  await usuarioRepo.cambiarContrasena(idUsuario, await bcrypt.hash(temporal, RONDAS_BCRYPT));
  return temporal;
}

async function medir<T>(fn: () => Promise<T>): Promise<{ ok: boolean; ms: number }> {
  const inicio = Date.now();
  try {
    await fn();
    return { ok: true, ms: Date.now() - inicio };
  } catch {
    return { ok: false, ms: Date.now() - inicio };
  }
}

// Comprueba el servidor, la base de datos y el servicio de IA (n8n).
export async function estadoSistema() {
  const bd = await medir(() => pool.query("SELECT 1"));
  let ia = { ok: false, ms: 0 };
  const webhook = process.env.N8N_GENERATE_PROPOSALS_WEBHOOK_URL;
  if (webhook) {
    const base = new URL(webhook).origin;
    ia = await medir(async () => {
      const r = await fetch(`${base}/healthz`, { signal: AbortSignal.timeout(6000) });
      if (!r.ok) throw new Error(String(r.status));
    });
  }
  const actividad = await usuarioRepo.actividadReciente(8).catch(() => []);
  return {
    servidor: { ok: true },
    base_datos: bd,
    servicio_ia: ia,
    actividad,
  };
}
