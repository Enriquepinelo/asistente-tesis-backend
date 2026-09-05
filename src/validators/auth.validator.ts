import { z } from "zod";

// Valida los datos de inicio de sesion antes de tocar la base de datos.
// Los mensajes estan en espanol porque el frontend los muestra tal cual.
export const loginSchema = z.object({
  correo: z
    .string({ required_error: "El correo es obligatorio." })
    .min(1, "El correo es obligatorio.")
    .email("El correo no tiene un formato válido."),
  contrasena: z
    .string({ required_error: "La contraseña es obligatoria." })
    .min(1, "La contraseña es obligatoria."),
});

export type LoginInput = z.infer<typeof loginSchema>;
