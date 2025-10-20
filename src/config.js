/**
 * Este archivo centraliza todas las variables de entorno de la aplicación.
 * Su propósito es leer los valores del archivo .env (o del entorno del servidor)
 * y exportarlos para que puedan ser utilizados de forma consistente en todo el proyecto.
 * Autor: Juan Carlos Govea Magaña
 * Fecha: 20/10/2025
 */

// --- Configuración de la Base de Datos ---
export const DB_USER = process.env.DB_USER;
export const DB_HOST = process.env.DB_HOST;
export const DB_PASSWORD = process.env.DB_PASSWORD;
export const DB_DATABASE = process.env.DB_DATABASE;
export const DB_PORT = process.env.DB_PORT;
// Convierte la variable de entorno de SSL (que es un string) a un booleano.
export const DB_SSL = process.env.DB_SSL === 'true';


// --- Configuración del Servidor ---
// Usa el puerto definido en el entorno, o el puerto 3000 como valor por defecto.
export const PORT = process.env.PORT || 3000;


// --- Configuración de Cloudinary ---
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;