/**
 * Este archivo se encarga de configurar y exportar el pool de conexiones
 * a la base de datos PostgreSQL.
 * Autor: Juan Carlos Govea Magaña
 * Fecha: 20/10/2025
 */

import pg from "pg";
import {
  DB_USER,
  DB_HOST,
  DB_PASSWORD,
  DB_DATABASE,
  DB_PORT,
  DB_SSL,
} from "./config.js";

// --- Validación de Variables de Entorno ---
// Antes de intentar conectar, se verifica que todas las variables necesarias
// para la base de datos estén definidas. Si falta alguna, la aplicación se detiene
// con un error claro para facilitar la configuración.
const requiredEnvVars = {
  DB_USER,
  DB_HOST,
  DB_PASSWORD,
  DB_DATABASE,
  DB_PORT,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  throw new Error(
    `Faltan las siguientes variables de entorno: ${missingVars.join(", ")}\n` +
      "Por favor verifica tu archivo .env"
  );
}

// --- Configuración del Pool de Conexiones ---
// Un "pool" es un conjunto de conexiones a la base de datos que se mantienen abiertas
// y se reutilizan para mejorar el rendimiento, evitando el costo de abrir y cerrar
// una conexión nueva para cada consulta.
const pool = new pg.Pool({
  user: DB_USER,
  host: DB_HOST,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  port: DB_PORT,

  // Configuración de SSL: se activa solo si la variable DB_SSL está definida.
  // 'rejectUnauthorized: false' es útil para servicios como Heroku, pero
  // en producción se recomienda una configuración más segura con certificados.
  ssl: DB_SSL ? { rejectUnauthorized: false } : false,

  // Configuraciones adicionales para optimizar el rendimiento y la estabilidad.
  max: 20, // Número máximo de clientes (conexiones) en el pool.
  idleTimeoutMillis: 30000, // Tiempo en ms antes de cerrar una conexión inactiva.
  connectionTimeoutMillis: 2000, // Tiempo en ms de espera para establecer una conexión.
});

export { pool };