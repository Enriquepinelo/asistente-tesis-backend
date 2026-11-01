import { AppError } from "./AppError";

// Tipos de archivo que el asesor puede subir con sus observaciones.
// El tipo se decide por el contenido real del archivo (su "firma" en los
// primeros bytes) y por la extensión, nunca por lo que diga el navegador.
interface TipoArchivo {
  extensiones: string[];
  mime: string;
  descripcion: string;
}

const TIPOS: Record<string, TipoArchivo> = {
  pdf: { extensiones: ["pdf"], mime: "application/pdf", descripcion: "PDF" },
  docx: { extensiones: ["docx"], mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", descripcion: "Word" },
  doc: { extensiones: ["doc"], mime: "application/msword", descripcion: "Word" },
  xlsx: { extensiones: ["xlsx"], mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", descripcion: "Excel" },
  xls: { extensiones: ["xls"], mime: "application/vnd.ms-excel", descripcion: "Excel" },
  pptx: { extensiones: ["pptx"], mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", descripcion: "PowerPoint" },
  ppt: { extensiones: ["ppt"], mime: "application/vnd.ms-powerpoint", descripcion: "PowerPoint" },
  png: { extensiones: ["png"], mime: "image/png", descripcion: "imagen PNG" },
  jpg: { extensiones: ["jpg", "jpeg"], mime: "image/jpeg", descripcion: "imagen JPG" },
};

export const EXTENSIONES_PERMITIDAS = Object.values(TIPOS).flatMap((t) => t.extensiones);
export const MAX_BYTES = 10 * 1024 * 1024;

const empiezaCon = (b: Buffer, firma: number[]) => firma.every((v, i) => b[i] === v);
const contiene = (b: Buffer, texto: string) => b.includes(Buffer.from(texto, "latin1"));

// Revisa los primeros bytes para saber qué es el archivo en realidad.
function detectarTipo(b: Buffer, extension: string): keyof typeof TIPOS | null {
  if (empiezaCon(b, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "pdf"; // %PDF-
  if (empiezaCon(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (empiezaCon(b, [0xff, 0xd8, 0xff])) return "jpg";

  // Word, Excel y PowerPoint modernos son un ZIP con carpetas propias por dentro.
  if (empiezaCon(b, [0x50, 0x4b, 0x03, 0x04])) {
    if (contiene(b, "word/")) return "docx";
    if (contiene(b, "xl/")) return "xlsx";
    if (contiene(b, "ppt/")) return "pptx";
    return null; // un ZIP cualquiera no se acepta
  }

  // Los formatos viejos de Office (.doc, .xls, .ppt) comparten la misma firma,
  // así que aquí la extensión decide cuál de los tres es.
  if (empiezaCon(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) {
    if (extension === "doc" || extension === "xls" || extension === "ppt") return extension;
    return null;
  }
  return null;
}

// Limpia el nombre para que no traiga rutas ni caracteres raros.
function limpiarNombre(nombre: string): string {
  const base = nombre.split(/[\\/]/).pop() ?? "";
  return base.replace(/[\u0000-\u001f<>:"|?*]/g, "").trim().slice(0, 200);
}

export interface ArchivoValidado {
  nombre: string;
  mime: string;
  contenido: Buffer;
}

export function validarArchivo(nombre: unknown, base64: unknown): ArchivoValidado {
  if (typeof nombre !== "string" || !limpiarNombre(nombre)) throw new AppError("Falta el nombre del archivo.", 400);
  if (typeof base64 !== "string" || !base64) throw new AppError("El archivo está vacío.", 400);

  const limpio = limpiarNombre(nombre);
  const extension = (limpio.split(".").pop() ?? "").toLowerCase();
  if (!limpio.includes(".") || !EXTENSIONES_PERMITIDAS.includes(extension)) {
    throw new AppError("Tipo de archivo no permitido. Se aceptan PDF, Word, Excel, PowerPoint e imágenes PNG o JPG.", 400);
  }

  const contenido = Buffer.from(base64, "base64");
  if (contenido.length === 0) throw new AppError("El archivo está vacío.", 400);
  if (contenido.length > MAX_BYTES) throw new AppError("El archivo no puede pasar de 10 MB.", 400);

  const tipo = detectarTipo(contenido, extension);
  if (!tipo) {
    throw new AppError("El contenido del archivo no es válido o está dañado. Verifique que sea un PDF, Word, Excel, PowerPoint o imagen real.", 400);
  }
  if (!TIPOS[tipo].extensiones.includes(extension)) {
    throw new AppError(`El archivo dice ser .${extension} pero su contenido es ${TIPOS[tipo].descripcion}. Revise el archivo.`, 400);
  }

  return { nombre: limpio, mime: TIPOS[tipo].mime, contenido };
}
