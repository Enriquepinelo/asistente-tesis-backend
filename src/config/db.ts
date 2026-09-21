import mysql from "mysql2/promise";
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";

// Conexion segura (SSL). Se activa solo si DB_SSL=true en las variables de entorno.
// - En tu computadora (MySQL local) no hace falta: deja DB_SSL vacio.
// - En Aiven (nube) es obligatorio: DB_SSL=true y DB_SSL_CA_PATH=certs/aiven-ca.pem
function configurarSSL() {
  if (process.env.DB_SSL !== "true") return undefined;

  const rutaCA = process.env.DB_SSL_CA_PATH;
  if (!rutaCA) {
    throw new Error(
      "DB_SSL=true pero falta DB_SSL_CA_PATH (ruta del certificado CA de Aiven)."
    );
  }
  return { ca: fs.readFileSync(path.resolve(process.cwd(), rutaCA), "utf8") };
}

// Pool de conexiones a MySQL. Se reutiliza en toda la aplicacion.
// Todas las consultas del sistema deben usar este pool con placeholders (?)
// para evitar inyeccion SQL. Nunca concatenar datos de usuario en el SQL.
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: configurarSSL(),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

// Verifica la conexion al iniciar el servidor. No expone credenciales en el log.
export async function verificarConexionBD(): Promise<void> {
  const conexion = await pool.getConnection();
  try {
    await conexion.query("SELECT 1");
    console.log("Conexion a MySQL (asistente_tesis) verificada correctamente.");
  } finally {
    conexion.release();
  }
}
