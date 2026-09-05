// Error controlado de la aplicacion. Permite lanzar errores con un mensaje
// seguro para el usuario final y un codigo HTTP, sin exponer detalles
// internos de MySQL ni stack traces al frontend.
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly esOperacional: boolean;

  constructor(mensaje: string, statusCode = 400) {
    super(mensaje);
    this.statusCode = statusCode;
    this.esOperacional = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
