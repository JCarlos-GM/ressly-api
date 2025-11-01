/**
 * Definición de rutas para el módulo de reportes
 * Fecha: 01/11/2025
 * Actualizado: Endpoints para reportes comunitarios y votación
 */

import { Router } from "express";
import multer from "multer";
import { 
  createReport, 
  getReportsByResident, 
  deleteReport,
  getCommunityReports,
  voteReport,
  removeVote
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
  upload.array("images", 5), 
  createReport
);

/**
 * GET /api/reports/resident/:idResident
 * Obtiene todos los reportes de un residente específico
 */
router.get("/resident/:idResident", getReportsByResident);

/**
 * GET /api/reports/community/:idResidential
 * Obtiene todos los reportes públicos de un residencial
 * Query params: ?filter=todas|semana|mes&idResident=xxx
 */
router.get("/community/:idResidential", getCommunityReports);

/**
 * POST /api/reports/vote
 * Vota por un reporte (upvote o downvote)
 * Body: { idReport, idResident, voteValue: 1 o -1 }
 */
router.post("/vote", voteReport);

/**
 * DELETE /api/reports/vote/:idReport/:idResident
 * Elimina el voto de un residente en un reporte
 */
router.delete("/vote/:idReport/:idResident", removeVote);

/**
 * DELETE /api/reports/delete/:idReport
 * Elimina un reporte por su ID
 */
router.delete("/delete/:idReport", deleteReport);

export default router;