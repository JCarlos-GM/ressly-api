import { Router } from "express";
import { getResidentByEmail } from "../controllers/residents.controller.js";

const router = Router();

// Ruta para obtener residente por email
router.get("/email/:email", getResidentByEmail);

export default router;