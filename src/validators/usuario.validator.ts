import { z } from "zod";

// Datos para que el administrador cree un usuario.
// Si el rol es "estudiante" se piden tambien sus datos academicos,
// porque el flujo de propuestas necesita el registro en la tabla estudiantes.
export const crearUsuarioSchema = z
  .object({
    nombre_usuario: z
      .string({ required_error: "El nombre de usuario es obligatorio." })
      .trim()
      .min(3, "El nombre de usuario debe tener al menos 3 caracteres.")
      .max(50, "El nombre de usuario es demasiado largo."),
    correo: z
      .string({ required_error: "El correo es obligatorio." })
      .trim()
      .toLowerCase()
      .email("El correo no tiene un formato válido."),
    contrasena: z
      .string({ required_error: "La contraseña es obligatoria." })
      .min(8, "La contraseña debe tener al menos 8 caracteres."),
    rol: z.enum(["estudiante", "asesor", "coordinador", "administrador"], {
      errorMap: () => ({ message: "El rol no es válido." }),
    }),
    nombre_completo: z.string().trim().optional(),
    carnet: z.string().trim().optional(),
    carrera: z.string().trim().optional(),
    sede: z.string().trim().optional().nullable(),
  })
  .superRefine((d, ctx) => {
    if (d.rol !== "estudiante") return;
    if (!d.nombre_completo) ctx.addIssue({ code: "custom", message: "El nombre completo del estudiante es obligatorio.", path: ["nombre_completo"] });
    if (!d.carnet) ctx.addIssue({ code: "custom", message: "El carnet del estudiante es obligatorio.", path: ["carnet"] });
    if (!d.carrera) ctx.addIssue({ code: "custom", message: "La carrera del estudiante es obligatoria.", path: ["carrera"] });
  });

export const cambiarEstadoSchema = z.object({
  estado: z.enum(["activo", "inactivo"], { errorMap: () => ({ message: "El estado debe ser activo o inactivo." }) }),
});

export type CrearUsuarioInput = z.infer<typeof crearUsuarioSchema>;

// Autorregistro de estudiantes: solo correos institucionales de la UMG.
export const DOMINIOS_PERMITIDOS = ["miumg.edu.gt", "umg.edu.gt"];

export const registroEstudianteSchema = z.object({
  nombre_completo: z.string({ required_error: "El nombre completo es obligatorio." }).trim().min(3, "Escriba su nombre completo."),
  carnet: z.string({ required_error: "El carnet es obligatorio." }).trim().min(4, "El carnet no es válido.").max(20, "El carnet no es válido."),
  carrera: z.string({ required_error: "La carrera es obligatoria." }).trim().min(3, "La carrera es obligatoria."),
  sede: z.string().trim().optional().nullable(),
  correo: z
    .string({ required_error: "El correo es obligatorio." })
    .trim()
    .toLowerCase()
    .email("El correo no tiene un formato válido.")
    .refine((c) => DOMINIOS_PERMITIDOS.includes(c.split("@")[1] ?? ""), {
      message: "Use su correo institucional (@miumg.edu.gt o @umg.edu.gt).",
    }),
  contrasena: z.string({ required_error: "La contraseña es obligatoria." }).min(8, "La contraseña debe tener al menos 8 caracteres."),
});

export type RegistroEstudianteInput = z.infer<typeof registroEstudianteSchema>;
