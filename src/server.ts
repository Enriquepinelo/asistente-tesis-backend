import app from "./app";
import { verificarConexionBD } from "./config/db";

const PUERTO = process.env.PORT || 3000;

async function iniciar() {
  try {
    await verificarConexionBD();
    app.listen(PUERTO, () => {
      console.log(`Servidor backend "Asistente de Tesis" escuchando en http://localhost:${PUERTO}`);
    });
  } catch (error) {
    console.error("No se pudo iniciar el servidor: falló la conexión a MySQL.");
    console.error(error);
    process.exit(1);
  }
}

iniciar();
