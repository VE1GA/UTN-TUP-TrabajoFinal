import { Team, User, TeamPlayer, Stat } from "../db.js";
import { UserRoles } from "../enums/enums.js";

// Servicio para crear un nuevo equipo
export const createTeam = async (req, res) => {
  // 1. Verificación de rol DENTRO del servicio
  const userRole = req.user.role;
  if (userRole !== UserRoles.EVENTMANAGER && userRole !== UserRoles.ADMIN) {
    return res.status(403).json({
      message: "Acceso denegado. Se requiere rol de Event Manager o Administrador.",
    });
  }

  // 2. Lógica para crear el equipo
  const { name } = req.body;
  const managerId = req.user.id; // El manager es el usuario que crea

  if (!name) {
    return res.status(400).json({ message: "El nombre del equipo es obligatorio." });
  }

  try {
    const newTeam = await Team.create({
      name,
      eventmanagerId: managerId,
    });
    await Stat.create({ teamId: newTeam.id }); // Crear estadísticas para el manager
    res.status(201).json(newTeam);
  } catch (error) {
    console.error("Error al crear equipo:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Servicio para obtener todos los equipos (para todos los usuarios)
export const getAllTeams = async (req, res) => {
  try {
    const teams = await Team.findAll({
      include: [
        {
          model: User,
          as: "manager", // Alias definido en db.js
          attributes: ["id", "name"], // Solo traer ID y Nombre
        },
        {
          model: User,
          as: "players", // Alias definido en db.js
          attributes: ["id", "name"], // Solo traer ID y Nombre
          through: { attributes: [] }, // No traer info de la tabla intermedia
        },
      ],
    });
    res.status(200).json(teams);
  } catch (error) {
    console.error("Error al obtener equipos:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Servicio para que un jugador se una a un equipo (para todos los usuarios)
export const joinTeam = async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.id;

  try {
    const team = await Team.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ message: "Equipo no encontrado." });
    }

    const existingTeamMembership = await TeamPlayer.findOne({
      where: { userId },
    });

    if (existingTeamMembership) {
      return res.status(400).json({
        message:
          "Ya eres miembro de un equipo. Debes abandonar tu equipo actual para unirte a uno nuevo.",
      });
    }

    await TeamPlayer.create({ userId, teamId });
    res.status(200).json({ message: "Te has unido al equipo exitosamente." });
  } catch (error) {
    console.error("Error al unirse al equipo:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Servicio para que un jugador abandone un equipo (para todos los usuarios)
export const leaveTeam = async (req, res) => {
  const { teamId } = req.params;
  const userId = req.user.id;

  try {
    const result = await TeamPlayer.destroy({
      where: { userId, teamId },
    });

    if (result === 0) {
      return res.status(404).json({ message: "No eres miembro de este equipo." });
    }

    res.status(200).json({ message: "Has abandonado el equipo." });
  } catch (error) {
    console.error("Error al abandonar el equipo:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

// Servicio para eliminar un equipo
export const deleteTeam = async (req, res) => {
  const { teamId } = req.params;
  const requestingUserId = req.user.id;
  const requestingUserRole = req.user.role;

  try {
    const team = await Team.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ message: "Equipo no encontrado." });
    }

    // 1. Verificación de rol DENTRO del servicio
    // Solo el manager que lo creó o un Admin puede borrarlo
    if (team.eventmanagerId !== requestingUserId && requestingUserRole !== UserRoles.ADMIN) {
      return res.status(403).json({ message: "No tienes permisos para eliminar este equipo." });
    }

    // 2. Lógica para eliminar el equipo
    await TeamPlayer.destroy({ where: { teamId } }); // Borrar jugadores
    await team.destroy(); // Borrar equipo

    res.status(200).json({ message: "Equipo eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar el equipo:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
