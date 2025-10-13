import express from "express";
import usersRoutes from "./routes/users.routes.js";
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
      usuario: "/api/usuarios/:id"
    }
  });
});

// Rutas de usuarios con prefijo /api
app.use("/api", usersRoutes);

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
    // Test de conexión
    const client = await pool.connect();
    console.log("✅ Conexión exitosa a PostgreSQL");
    client.release();
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`\n🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`📋 Endpoints disponibles:`);
      console.log(`   GET    http://localhost:${PORT}/api/usuarios`);
      console.log(`   GET    http://localhost:${PORT}/api/usuarios/:id`);
      console.log(`   POST   http://localhost:${PORT}/api/usuarios`);
      console.log(`   PUT    http://localhost:${PORT}/api/usuarios/:id`);
      console.log(`   DELETE http://localhost:${PORT}/api/usuarios/:id\n`);
    });
  } catch (error) {
    console.error("❌ Error al conectar con PostgreSQL:", error.message);
    console.error("Verifica tu archivo .env y la conexión a la base de datos");
    process.exit(1);
  }
};

startServer();