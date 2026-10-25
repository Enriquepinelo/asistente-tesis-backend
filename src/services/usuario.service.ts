import bcrypt from "bcrypt";
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
