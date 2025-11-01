import { Router } from "express";
import multer from "multer";
import { registerPet, getPetsByResident, updatePet } from "../controllers/pets.controller.js";

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Ruta para registrar una mascota
router.post(
  "/register",
  upload.fields([{ name: "petImage", maxCount: 1 }]),
  registerPet
);

// Ruta para obtener mascotas de un residente
router.get("/resident/:idResident", getPetsByResident);

// Ruta para actualizar una mascota
router.put("/update/:idPet", updatePet);

export default router;