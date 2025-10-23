import { User } from "../db.js";
import bcrypt from "bcryptjs"; // <--- 1. IMPORTAMOS BCRYPT

export const getUserList = async (req, res) => {
  const UserList = await User.findAll();
  res.json(UserList);
};

export const DeleteUser = async (req, res) => {
  const { id } = req.params;
  await User.destroy({ where: { id } });
  res.json({ message: `[BACKEND] Usuario con id ${id} borrado exitosamente` });
};

// --- 2. FUNCIÓN COMPLETAMENTE REEMPLAZADA ---
export const EditExistingUser = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body; // Obtenemos los datos del formulario

  try {
    // 3. Verificamos si se proveyó una nueva contraseña
    if (updateData.password && updateData.password.trim() !== "") {
      // Si hay una contraseña nueva, la hasheamos
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    } else {
      // Si la contraseña está vacía o no existe en el body,
      // la eliminamos del objeto 'updateData'.
      // Esto es CRUCIAL para no sobrescribir la contraseña existente.
      delete updateData.password;
    }

    // 4. Actualizamos el usuario solo con los datos pertinentes
    await User.update(updateData, { where: { id } });

    res.json({ message: `[BACKEND] Usuario con id ${id} editado exitosamente` });
  } catch (error) {
    console.error("Error al editar usuario:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
