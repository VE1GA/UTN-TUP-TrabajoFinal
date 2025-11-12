import { Stat, User, Team } from "../db.js";
import { Op } from "sequelize";

// --- RANKING INDIVIDUAL (SIN CAMBIOS) ---
export const getIndividualRanking = async (req, res) => {
  try {
    const ranking = await Stat.findAll({
      include: {
        model: User,
        attributes: ["name"],
      },
      where: {
        userId: {
          [Op.not]: null,
        },
        gamesplayed: {
          [Op.gt]: 0,
        },
      },
      order: [
        ["gameswon", "DESC"],
        ["winrate", "DESC"],
      ],
      limit: 25,
    });
    res.status(200).json(ranking);
  } catch (error) {
    console.error("Error al obtener ranking individual:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// --- RANKING DE EQUIPOS (HISTÓRICO) ---
// Esta función ahora lee los campos históricos (gameswon, winrate)
// que ya NO se resetean.
export const getTeamRanking = async (req, res) => {
  try {
    const ranking = await Stat.findAll({
      where: {
        teamId: { [Op.not]: null },
        gamesplayed: { [Op.gt]: 0 }, // <-- Lee histórico
      },
      include: {
        model: Team,
        attributes: ["name"],
      },
      order: [
        ["gameswon", "DESC"], // <-- Lee histórico
        ["winrate", "DESC"], // <-- Lee histórico
      ],
      limit: 25,
    });
    res.status(200).json(ranking);
  } catch (error) {
    console.error("Error al obtener ranking de equipos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// --- RANKING SEMANAL (PARA LA PÁGINA DE TORNEOS) ---
// Esta función AHORA lee los campos "weekly_"
export const getTeamWeeklyRanking = async (req, res) => {
  try {
    const stats = await Stat.findAll({
      where: {
        teamId: { [Op.not]: null },
        weekly_gamesplayed: { [Op.gt]: 0 }, // <-- CAMBIADO
      },
      include: { model: Team, attributes: ["name"] },
      order: [
        ["weekly_gameswon", "DESC"], // <-- CAMBIADO
        ["weekly_winrate", "DESC"], // <-- CAMBIADO
      ],
    });

    // Mapeamos los campos weekly_ a la respuesta
    const ranking = stats.map((stat) => ({
      id: stat.id,
      team: { name: stat.team.name },
      gameswon: stat.weekly_gameswon, // <-- CAMBIADO
      gameslost: stat.weekly_gameslost, // <-- CAMBIADO
      winrate: stat.weekly_winrate, // <-- CAMBIADO
    }));

    res.status(200).json(ranking);
  } catch (error) {
    console.log("Error ranking semanal:", error);
    res.status(500).json({ message: "Error interno" });
  }
};
