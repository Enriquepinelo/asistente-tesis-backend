import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { AppError } from "../utils/AppError";
import { buscarUsuarioPorCorreo } from "../repositories/usuario.repository";
import { buscarEstudiantePorCorreo } from "../repositories/estudiante.repository";
import { JwtPayload } from "../types/models";

export interface ResultadoLogin {
  token: string;
  usuario: {
    id_usuario: number;
    nombre_usuario: string;
    correo: string;
    rol: JwtPayload["rol"];
    id_estudiante: number | null;
    nombre_completo: string | null;
  };
}

export async function iniciarSesion(correo: string, contrasena: string): Promise<ResultadoLogin> {
  const usuario = await buscarUsuarioPorCorreo(correo);

  // Mensaje generico a proposito: no revelar si el correo existe o no.
  if (!usuario || usuario.estado !== "activo") {
    throw new AppError("Correo o contraseña incorrectos.", 401);
  }

  const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasena_hash);
  if (!contrasenaValida) {
    throw new AppError("Correo o contraseña incorrectos.", 401);
  }

  // Vinculo usuarios_sistema <-> estudiantes por correo (decision de Fase 1).
  let idEstudiante: number | null = null;
  let nombreCompleto: string | null = null;
  if (usuario.rol === "estudiante") {
    const estudiante = await buscarEstudiantePorCorreo(usuario.correo);
    if (estudiante) {
      idEstudiante = estudiante.id_estudiante;
      nombreCompleto = estudiante.nombre_completo;
    }
  }

  const payload: JwtPayload = {
    id_usuario: usuario.id_usuario,
    correo: usuario.correo,
    rol: usuario.rol,
    id_estudiante: idEstudiante,
  };

  const secreto = process.env.JWT_SECRET as string;
  const opciones: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRES_IN || "8h") as SignOptions["expiresIn"],
  };
  const token = jwt.sign(payload, secreto, opciones);

  return {
    token,
    usuario: {
      id_usuario: usuario.id_usuario,
      nombre_usuario: usuario.nombre_usuario,
      correo: usuario.correo,
      rol: usuario.rol,
      id_estudiante: idEstudiante,
      nombre_completo: nombreCompleto,
    },
  };
}
