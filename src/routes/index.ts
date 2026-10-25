import { Router } from "express";
import authRoutes from "./auth.routes";
import dashboardRoutes from "./dashboard.routes";
import formularioRoutes from "./formulario.routes";
import propuestaRoutes from "./propuesta.routes";
import historialRoutes from "./historial.routes";
import recomendacionRoutes from "./recomendacion.routes";
import usuarioRoutes from "./usuario.routes";
import coordinacionRoutes from "./coordinacion.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/formularios", formularioRoutes);
router.use("/propuestas", propuestaRoutes);
router.use("/historial", historialRoutes);
router.use("/recomendaciones", recomendacionRoutes);
router.use("/usuarios", usuarioRoutes);
router.use("/coordinacion", coordinacionRoutes);

export default router;
