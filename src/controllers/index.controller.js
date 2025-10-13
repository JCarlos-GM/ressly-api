import { pool } from "../db.js";

export const getUsuarios = async (req, res) => {
  const response = await pool.query("SELECT * FROM usuarios ORDER BY id ASC");
  res.status(200).json(response.rows);
};

export const getUsuarioById = async (req, res) => {
  const id = parseInt(req.params.id);
  const response = await pool.query("SELECT * FROM usuarios WHERE id = $1", [id]);
  res.json(response.rows);
};

export const createUsuario = async (req, res) => {
  try {
    const { nombre, correo, contraseña } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO usuarios (nombre, correo, contraseña) VALUES ($1, $2, $3) RETURNING *",
      [nombre, correo, contraseña]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateUsuario = async (req, res) => {
  const id = parseInt(req.params.id);
  const { nombre, correo } = req.body;
  const { rows } = await pool.query(
    "UPDATE usuarios SET nombre = $1, correo = $2 WHERE id = $3 RETURNING *",
    [nombre, correo, id]
  );
  return res.json(rows[0]);
};

export const deleteUsuario = async (req, res) => {
  const id = parseInt(req.params.id);
  const { rowCount } = await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);
  if (rowCount === 0) {
    return res.status(404).json({ message: "Usuario no encontrado" });
  }
  return res.sendStatus(204);
};