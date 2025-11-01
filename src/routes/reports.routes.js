/**
 * Definición de rutas para el módulo de reportes
 * Fecha: 01/11/2025
 */

import { Router } from "express";
import multer from "multer";
import { 
  createReport, 
  getReportsByResident, 
  deleteReport 
} from "../controllers/reports.controller.js";

const router = Router();

// Configuración de Multer para almacenar en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * POST /api/reports/create
 * Crea un nuevo reporte con múltiples imágenes
 */
router.post(
  "/create",
  upload.fields([{ name: "reportImages", maxCount: 5 }]),
  createReport
);

/**
 * GET /api/reports/resident/:idResident
 * Obtiene todos los reportes de un residente específico
 */
router.get("/resident/:idResident", getReportsByResident);

/**
 * DELETE /api/reports/delete/:idReport
 * Elimina un reporte por su ID
 */
router.delete("/delete/:idReport", deleteReport);

export default router;