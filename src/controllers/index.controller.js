import { pool } from "../db.js";

export const getUsuarios = async (req, res) => {
  try {
    const response = await pool.query("SELECT * FROM usuarios ORDER BY id ASC");
    res.status(200).json(response.rows);
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({ 
      error: "Error al conectar con la base de datos",
      details: error.message 
    });
  }
};

export const getUsuarioById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const response = await pool.query("SELECT * FROM usuarios WHERE id = $1", [id]);
    
    if (response.rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    res.json(response.rows[0]);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ 
      error: "Error al conectar con la base de datos",
      details: error.message 
    });
  }
};

export const createUsuario = async (req, res) => {
  try {
    const { nombre, correo, contrasena } = req.body;
    
    if (!nombre || !correo || !contrasena) {
      return res.status(400).json({ 
        error: "Todos los campos son requeridos (nombre, correo, contrasena)" 
      });
    }
    
    const { rows } = await pool.query(
      "INSERT INTO usuarios (nombre, correo, contrasena) VALUES ($1, $2, $3) RETURNING *",
      [nombre, correo, contrasena]
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Error al crear usuario:", error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ 
        error: "El correo ya está registrado" 
      });
    }
    
    res.status(500).json({ 
      error: "Error al crear usuario",
      details: error.message 
    });
  }
};

export const updateUsuario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { nombre, correo } = req.body;
    
    const { rows } = await pool.query(
      "UPDATE usuarios SET nombre = $1, correo = $2 WHERE id = $3 RETURNING *",
      [nombre, correo, id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({ 
      error: "Error al actualizar usuario",
      details: error.message 
    });
  }
};

export const deleteUsuario = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { rowCount } = await pool.query("DELETE FROM usuarios WHERE id = $1", [id]);
    
    if (rowCount === 0) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }
    
    res.sendStatus(204);
  } catch (error) {
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ 
      error: "Error al eliminar usuario",
      details: error.message 
    });
  }
};