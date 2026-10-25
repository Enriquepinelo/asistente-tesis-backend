import { Router } from "express";
import * as propuestaController from "../controllers/propuesta.controller";
import * as documentoController from "../controllers/documento.controller";
import { requiereAutenticacion, permitirRoles } from "../middleware/auth";

const router = Router();

router.use(requiereAutenticacion);
router.get("/", propuestaController.listar);
// Documentos de revision: el asesor y el coordinador suben; el estudiante dueno y el personal descargan.
router.get("/documentos/:idDocumento/descargar", documentoController.descargar);
router.get("/:id/documentos", documentoController.listar);
router.post("/:id/documentos", permitirRoles("asesor", "coordinador"), documentoController.subir);
router.get("/:id", propuestaController.obtener);
router.get("/:id/descargar", propuestaController.descargar);
router.patch("/:id", permitirRoles("asesor", "coordinador"), propuestaController.cambiarEstado);

export default router;
