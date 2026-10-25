import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AppError } from "../utils/AppError";
import * as repo from "../repositories/documento.repository";

const TIPOS_PERMITIDOS: Record<string, string> = {
  "application/pdf": "pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/msword": "doc",
};
const MAX_BYTES = 5 * 1024 * 1024;
const PERSONAL = ["asesor", "coordinador", "administrador"];

function leerId(valor: string): number {
  const id = Number(valor);
  if (!Number.isInteger(id) || id <= 0) throw new AppError("Identificador inválido.", 400);
  return id;
}

// Si la tabla aun no existe se responde con un mensaje claro en vez de un error interno.
function tablaFaltante(error: any): never {
  if (error?.code === "ER_NO_SUCH_TABLE") {
    throw new AppError("La función de documentos aún no está activada: falta crear la tabla documentos_revision.", 503);
  }
  throw error;
}

// El estudiante solo puede ver documentos de sus propias propuestas.
async function verificarAcceso(req: Request, idPropuesta: number) {
  if (PERSONAL.includes(req.usuario!.rol)) return;
  const dueno = await repo.estudianteDePropuesta(idPropuesta);
  if (!dueno || dueno !== req.usuario!.id_estudiante) {
    throw new AppError("No tiene permiso para ver estos documentos.", 403);
  }
}

export const subir = asyncHandler(async (req: Request, res: Response) => {
  const idPropuesta = leerId(req.params.id);
  const { nombre, tipo, base64 } = req.body ?? {};
  if (typeof nombre !== "string" || !nombre.trim()) throw new AppError("Falta el nombre del archivo.", 400);
  if (!TIPOS_PERMITIDOS[tipo]) throw new AppError("Solo se permiten archivos PDF o Word.", 400);
  if (typeof base64 !== "string" || !base64) throw new AppError("El archivo está vacío.", 400);
  const contenido = Buffer.from(base64, "base64");
  if (contenido.length === 0) throw new AppError("El archivo está vacío.", 400);
  if (contenido.length > MAX_BYTES) throw new AppError("El archivo no puede pasar de 5 MB.", 400);
  if (!(await repo.estudianteDePropuesta(idPropuesta))) throw new AppError("La propuesta no existe.", 404);

  try {
    const id = await repo.crearDocumento({
      id_propuesta: idPropuesta,
      nombre_archivo: nombre.trim().slice(0, 200),
      tipo_mime: tipo,
      contenido,
      subido_por: req.usuario!.id_usuario,
    });
    res.status(201).json({ exito: true, mensaje: "Documento subido.", id_documento: id });
  } catch (error) {
    tablaFaltante(error);
  }
});

export const listar = asyncHandler(async (req: Request, res: Response) => {
  const idPropuesta = leerId(req.params.id);
  await verificarAcceso(req, idPropuesta);
  try {
    res.json({ exito: true, documentos: await repo.listarPorPropuesta(idPropuesta) });
  } catch (error) {
    tablaFaltante(error);
  }
});

export const descargar = asyncHandler(async (req: Request, res: Response) => {
  let doc;
  try {
    doc = await repo.obtenerDocumento(leerId(req.params.idDocumento));
  } catch (error) {
    tablaFaltante(error);
  }
  if (!doc) throw new AppError("El documento no existe.", 404);
  if (!PERSONAL.includes(req.usuario!.rol) && Number(doc.id_estudiante) !== req.usuario!.id_estudiante) {
    throw new AppError("No tiene permiso para ver este documento.", 403);
  }
  res.setHeader("Content-Type", doc.tipo_mime);
  res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(doc.nombre_archivo)}`);
  res.send(doc.contenido);
});

export const misDocumentos = asyncHandler(async (req: Request, res: Response) => {
  const idEstudiante = req.usuario?.id_estudiante;
  if (!idEstudiante) throw new AppError("Esta acción solo está disponible para estudiantes.", 403);
  try {
    res.json({ exito: true, documentos: await repo.listarPorEstudiante(idEstudiante) });
  } catch (error) {
    tablaFaltante(error);
  }
});
