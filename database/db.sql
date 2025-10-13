import pg from "pg";
import {
  DB_DATABASE,
  DB_HOST,
  DB_PASSWORD,
  DB_PORT,
  DB_USER,
} from "./config.js";

const { Pool } = pg;

// --- AÑADE ESTAS LÍNEAS PARA DEPURAR ---
console.log("--- Variables de Entorno Cargadas ---");
console.log("USER:", DB_USER);
console.log("HOST:", DB_HOST);
console.log("DATABASE:", DB_DATABASE);
console.log("PASSWORD:", DB_PASSWORD ? "Cargada (oculta)" : "NO CARGADA");
console.log("PORT:", DB_PORT);
console.log("------------------------------------");

export const pool = new Pool({
  user: DB_USER,
  host: DB_HOST,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  port: DB_PORT,
  ssl: {
    rejectUnauthorized: false,
  },
});