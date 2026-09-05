import { z } from "zod";

// Campos obligatorios segun la tabla formularios_tesis real:
// area_interes y descripcion_problema son NOT NULL en la base de datos.
// El resto son opcionales, pero si el estudiante presiona "Generar propuesta"
// exigimos ademas linea_investigacion, tipo_problema y poblacion_beneficiada,
// porque son necesarios para que las propuestas tengan sentido academico.

export const formularioBorradorSchema = z.object({
  area_interes: z.string().min(1, "El área de interés es obligatoria."),
  linea_investigacion: z.string().optional().nullable(),
  tipo_problema: z.string().optional().nullable(),
  descripcion_problema: z.string().min(1, "La descripción del problema es obligatoria."),
  contexto: z.string().optional().nullable(),
  poblacion_beneficiada: z.string().optional().nullable(),
  objetivo_proyecto: z.string().optional().nullable(),
  recursos_disponibles: z.string().optional().nullable(),
  alcance_estimado: z.string().optional().nullable(),
  observaciones: z.string().optional().nullable(),
});

export const formularioGenerarPropuestaSchema = formularioBorradorSchema.extend({
  linea_investigacion: z.string().min(1, "La línea de investigación es obligatoria."),
  tipo_problema: z.string().min(1, "El tipo de problema es obligatorio."),
  poblacion_beneficiada: z.string().min(1, "La población beneficiada es obligatoria."),
});

export type FormularioBorradorInput = z.infer<typeof formularioBorradorSchema>;
export type FormularioGenerarPropuestaInput = z.infer<typeof formularioGenerarPropuestaSchema>;
