// Tipos que reflejan la estructura REAL de las tablas de asistente_tesis,
// confirmada mediante SHOW CREATE TABLE. No agregar campos inventados aqui.

export type RolUsuario = "estudiante" | "asesor" | "coordinador" | "administrador";
export type EstadoActivoInactivo = "activo" | "inactivo";

export interface UsuarioSistema {
  id_usuario: number;
  nombre_usuario: string;
  correo: string;
  contrasena_hash: string;
  rol: RolUsuario;
  estado: EstadoActivoInactivo;
  fecha_creacion: string;
}

export interface Estudiante {
  id_estudiante: number;
  nombre_completo: string;
  correo: string;
  carnet: string;
  carrera: string;
  sede: string | null;
  fecha_registro: string;
  estado: EstadoActivoInactivo;
}

export type EstadoFormulario = "borrador" | "procesado" | "error";

export interface FormularioTesis {
  id_formulario: number;
  id_estudiante: number;
  area_interes: string;
  linea_investigacion: string | null;
  tipo_problema: string | null;
  descripcion_problema: string;
  contexto: string | null;
  poblacion_beneficiada: string | null;
  objetivo_proyecto: string | null;
  recursos_disponibles: string | null;
  alcance_estimado: string | null;
  observaciones: string | null;
  fecha_creacion: string;
  estado: EstadoFormulario;
}

export type EstadoPropuesta = "generada" | "revisada" | "ajustada" | "aprobada";

export interface PropuestaGenerada {
  id_propuesta: number;
  id_formulario: number;
  propuesta_tema_1: string;
  propuesta_tema_2: string | null;
  propuesta_tema_3: string | null;
  planteamiento_problema: string;
  objetivo_general: string;
  objetivos_especificos: string;
  justificacion: string;
  modelo_ia: string | null;
  fecha_generacion: string;
  version: number;
  estado: EstadoPropuesta;
}

export type EstadoFlujo = "exitoso" | "fallido" | "validacion_error" | "ia_error" | "bd_error";

export interface HistorialFlujo {
  id_historial: number;
  id_formulario: number | null;
  id_propuesta: number | null;
  identificador_solicitud: string;
  nombre_flujo: string;
  estado_flujo: EstadoFlujo;
  mensaje: string | null;
  tiempo_respuesta_ms: number | null;
  fecha_ejecucion: string;
}

export interface RecomendacionApoyo {
  id_recomendacion: number;
  id_formulario: number;
  tipo_recomendacion: string;
  contenido: string;
  fuente: string;
  fecha_creacion: string;
}

export type Prioridad = "alta" | "media" | "baja";

// Datos que viajan dentro del token JWT
export interface JwtPayload {
  id_usuario: number;
  correo: string;
  rol: RolUsuario;
  id_estudiante: number | null;
}
