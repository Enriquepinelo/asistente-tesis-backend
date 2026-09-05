import mysql from "mysql2/promise";
import "dotenv/config";

// Pool de conexiones a MySQL. Se reutiliza en toda la aplicacion.
// Todas las consultas del sistema deben usar este pool con placeholders (?)
// para evitar inyeccion SQL. Nunca concatenar datos de usuario en el SQL.
export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
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
