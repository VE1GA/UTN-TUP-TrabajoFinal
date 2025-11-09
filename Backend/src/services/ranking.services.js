import { Stat, User, Team } from "../db.js";
import { Op } from "sequelize"; // <-- Asegúrate de tener esta línea

// Servicio para obtener el ranking individual
export const getIndividualRanking = async (req, res) => {
  try {
    const ranking = await Stat.findAll({
      // Incluimos los datos del usuario para mostrar su nombre
      include: {
        model: User,
        attributes: ["name"], // Solo queremos el nombre
      },
      // Filtramos usuarios que no han jugado
      where: {
        userId: {
          [Op.not]: null,
        },
        gamesplayed: {
          [Op.gt]: 0, // Op.gt significa "greater than" (mayor que) 0
        },
      },
      // Ordenamos: primero por más victorias, luego por winrate
      order: [
        ["gameswon", "DESC"],
        ["winrate", "DESC"],
      ],
      limit: 25, // Traemos solo el Top 25
    });

    res.status(200).json(ranking);
  } catch (error) {
    console.error("Error al obtener ranking individual:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Servicio para obtener el ranking de equipos
export const getTeamRanking = async (req, res) => {
  try {
    const ranking = await Stat.findAll({
      where: {
        teamId: { [Op.not]: null }, // Solo traer estadísticas de EQUIPOS
        gamesplayed: { [Op.gt]: 0 },
      },
      include: {
        model: Team, // Incluimos el modelo del Equipo para saber el nombre
        attributes: ["name"],
      },
      order: [
        ["gameswon", "DESC"],
        ["winrate", "DESC"],
      ],
      limit: 25,
    });
    res.status(200).json(ranking);
  } catch (error) {
    console.error("Error al obtener ranking de equipos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const getTeamWeeklyRanking = async (req, res) => {
  try {
    const stats = await Stat.findAll({
      where: { teamId: { [Op.not]: null } },
      include: { model: Team, attributes: ["name"] },
      order: [
        ["gameswon", "DESC"],
        ["winrate", "DESC"],
      ],
    });

    const ranking = stats.map((stat, index) => ({
      id: stat.id,
      team: { name: stat.team.name },
      gameswon: stat.gameswon,
      gameslost: stat.gameslost,
      winrate: stat.winrate,
    }));

    res.status(200).json(ranking);
  } catch (error) {
    console.log("Error ranking semanal:", error);
    res.status(500).json({ message: "Error interno" });
  }
};
