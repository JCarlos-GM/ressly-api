import pg from "pg";
import {
  DB_USER,
  DB_HOST,
  DB_PASSWORD,
  DB_DATABASE,
  DB_PORT,
  DB_SSL
} from "./config.js";

// Validar que todas las variables de entorno requeridas estén presentes
const requiredEnvVars = {
  DB_USER,
  DB_HOST,
  DB_PASSWORD,
  DB_DATABASE,
  DB_PORT
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `❌ Faltan las siguientes variables de entorno: ${missingVars.join(', ')}\n` +
    'Por favor verifica tu archivo .env'
  );
}

// Configuración del pool de conexiones
const pool = new pg.Pool({
  user: DB_USER,
  host: DB_HOST,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  port: DB_PORT,
  ssl: DB_SSL ? {
    rejectUnauthorized: false
  } : false,
  // Configuraciones adicionales recomendadas
  max: 20, // Número máximo de clientes en el pool
  idleTimeoutMillis: 30000, // Tiempo antes de cerrar clientes inactivos
  connectionTimeoutMillis: 2000, // Tiempo máximo de espera para conectar
});

// Event listeners para debugging (opcional en producción)
pool.on('connect', () => {
  console.log('🔌 Nueva conexión establecida con PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error inesperado en el cliente de PostgreSQL:', err);
  process.exit(-1);
});

console.log('✅ Pool de PostgreSQL configurado correctamente');

export { pool };