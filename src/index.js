/**
 * Este es el archivo principal de la API (entry point).
 * Se encarga de configurar el servidor de Express, definir los middlewares,
 * registrar las rutas y arrancar la aplicación.
 * Autor: Juan Carlos Govea Magaña
 * Fecha: 20/10/2025
 */

import express from "express";
import cors from "cors"; 
import usersRoutes from "./routes/users.routes.js";
import registerRoutes from "./routes/register.routes.js";
import reportsRoutes from "./routes/reports.routes.js"; 
import petsRoutes from "./routes/pets.routes.js";
import morgan from "morgan";
import { PORT } from "./config.js";
import { pool } from "./db.js";
import residentsRoutes from "./routes/residents.routes.js";

const app = express();

// --- Middlewares ---
// *** AGREGAR CORS AQUÍ - ANTES DE MORGAN ***
app.use(cors({
  origin: '*', // Permite todas las origenes
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Morgan se usa para registrar las peticiones HTTP en la consola (útil en desarrollo).
app.use(morgan("dev"));
// Middlewares de Express para interpretar JSON y datos de formularios.
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/residents", residentsRoutes);
app.use("/api/pets", petsRoutes);
app.use("/api/reports", reportsRoutes);

// --- Ruta Raíz (Health Check) ---
// Sirve como una comprobación rápida para ver si la API está en línea y funcionando.
app.get("/", (req, res) => {
  res.json({
    message: "API de Ressly - REST API con Node.js y PostgreSQL",
    status: "online",
    version: "1.0.0",
    endpoints: {
      usuarios: "/api/usuarios",
      usuario: "/api/usuarios/:id",
      registro_validate_code: "/api/register/validate-code",
      registro_resident: "/api/register/resident",
    },
  });
});

// --- Registro de Rutas ---
// Se asignan las rutas importadas a sus prefijos correspondientes.
app.use("/api", usersRoutes);
app.use("/api/register", registerRoutes);

// --- Manejo de Rutas No Encontradas (404) ---
// Si una petición no coincide con ninguna de las rutas anteriores, caerá aquí.
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint no encontrado",
    path: req.path,
    message: "Verifica la URL y el método HTTP",
  });
});

// --- Manejador de Errores Global ---
// Middleware final que atrapa cualquier error que ocurra en la aplicación.
app.use((err, req, res, next) => {
  res.status(500).json({
    error: "Error interno del servidor",
    message: err.message,
  });
});

// --- Arranque del Servidor ---
// Función que primero verifica la conexión con la base de datos
// y, si es exitosa, inicia el servidor de Express.
const startServer = async () => {
  try {
    const client = await pool.connect();
    console.log("Conexión exitosa a PostgreSQL");
    client.release();

    app.listen(PORT, () => {
      console.log(`\nServidor corriendo en puerto ${PORT}`);
      console.log(`http://localhost:${PORT}`);
      console.log(`Endpoints disponibles:`);
      console.log(`POST   http://localhost:${PORT}/api/register/validate-code`);
      console.log(`POST   http://localhost:${PORT}/api/register/resident\n`);
    });
  } catch (error) {
    console.error("Error al conectar con PostgreSQL:", error.message);
    process.exit(1); // Detiene la aplicación si no se puede conectar a la BD.
  }
};

startServer();