import { FormularioTesis, Estudiante } from "../types/models";

export interface RespuestaN8n {
  success: boolean;
  message: string;
  id_formulario: number;
  propuestas_generadas: number;
  recomendaciones_generadas: number;
}

// Llama al webhook de n8n que genera propuestas y recomendaciones.
// El frontend NUNCA llama a n8n directamente: siempre pasa por aqui.
//
// El nodo "Validar Campos" del workflow de n8n exige tambien los datos
// del estudiante (nombre_estudiante, correo, carnet, carrera, sede),
// ademas de los datos propios del formulario. Por eso se recibe el
// estudiante como segundo parametro y se incluye en el payload.
export async function solicitarGeneracionDePropuestas(
  formulario: FormularioTesis,
  estudiante: Estudiante
): Promise<RespuestaN8n> {
  const url = process.env.N8N_GENERATE_PROPOSALS_WEBHOOK_URL;
  if (!url) {
    throw new Error("N8N_GENERATE_PROPOSALS_WEBHOOK_URL no está configurada en el .env");
  }

  const payload = {
    id_formulario: formulario.id_formulario,
    id_estudiante: formulario.id_estudiante,
    nombre_estudiante: estudiante.nombre_completo,
    correo: estudiante.correo,
    carnet: estudiante.carnet,
    carrera: estudiante.carrera,
    sede: estudiante.sede,
    area_interes: formulario.area_interes,
    linea_investigacion: formulario.linea_investigacion,
    tipo_problema: formulario.tipo_problema,
    descripcion_problema: formulario.descripcion_problema,
    contexto: formulario.contexto,
    poblacion_beneficiada: formulario.poblacion_beneficiada,
    objetivo_proyecto: formulario.objetivo_proyecto,
    recursos_disponibles: formulario.recursos_disponibles,
    alcance_estimado: formulario.alcance_estimado,
    observaciones: formulario.observaciones,
  };

  const controlador = new AbortController();
  const tiempoLimite = setTimeout(() => controlador.abort(), 20000); // 20s de margen

  let respuesta: Response;
  try {
    respuesta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controlador.signal,
    });
  } catch (error) {
    throw new Error(
      "No se pudo contactar al servicio de generación de propuestas (n8n). Verifique que esté activo."
    );
  } finally {
    clearTimeout(tiempoLimite);
  }

  if (!respuesta.ok) {
    throw new Error(`El servicio de generación de propuestas respondió con error (${respuesta.status}).`);
  }

  const datos = (await respuesta.json()) as RespuestaN8n;
  return datos;
}
