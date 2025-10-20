import express from "express";
import usersRoutes from "./routes/users.routes.js";
import registerRoutes from "./routes/register.routes.js";
import morgan from "morgan";
import { PORT } from "./config.js";
import { pool } from "./db.js";

const app = express();

// Middlewares
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Ruta raíz - Health check
app.get("/", (req, res) => {
  res.json({ 
    message: "API de Ressly - REST API con Node.js y PostgreSQL",
    status: "online",
    version: "1.0.0",
    endpoints: {
      usuarios: "/api/usuarios",
      usuario: "/api/usuarios/:id",
      registro_validate_code: "/api/register/validate-code",
      registro_resident: "/api/register/resident"
    }
  });
});

// Rutas
app.use("/api", usersRoutes);
app.use("/api/register", registerRoutes);  // <-- CORREGIDO

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ 
    error: "Endpoint no encontrado",
    path: req.path,
    message: "Verifica la URL y el método HTTP"
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    error: "Error interno del servidor",
    message: err.message 
  });
});

// Verificar conexión a BD e iniciar servidor
const startServer = async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Conexión exitosa a PostgreSQL");
    client.release();
    
    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`📋 Endpoints disponibles:`);
      console.log(`   POST   http://localhost:${PORT}/api/register/validate-code`);
      console.log(`   POST   http://localhost:${PORT}/api/register/resident\n`);
    });
  } catch (error) {
    console.error("❌ Error al conectar con PostgreSQL:", error.message);
    process.exit(1);
  }
};

startServer();
