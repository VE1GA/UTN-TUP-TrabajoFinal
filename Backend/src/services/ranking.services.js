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
    // A. Obtenemos todos los equipos
    const teams = await Team.findAll({
      include: [
        {
          model: User,
          as: "players", // Incluimos los jugadores (alias de db.js)
          attributes: ["id"], // Solo necesitamos sus IDs
          include: [
            {
              model: Stat, // Incluimos las estadísticas de CADA jugador
              attributes: ["gameswon", "gameslost"],
            },
          ],
        },
      ],
    });

    // B. Calculamos el puntaje de cada equipo en JavaScript
    const teamScores = teams.map((team) => {
      let totalVictories = 0;
      let totalDefeats = 0;

      team.players.forEach((player) => {
        // 'stat' es singular porque User.hasOne(Stat)
        if (player.stat) {
          totalVictories += player.stat.gameswon;
          totalDefeats += player.stat.gameslost;
        }
      });

      return {
        id: team.id,
        name: team.name,
        totalVictories,
        totalDefeats,
        // Calculamos un winrate simple para el equipo
        winrate:
          totalVictories + totalDefeats > 0
            ? (totalVictories / (totalVictories + totalDefeats)) * 100
            : 0,
      };
    });

    // C. Ordenamos los equipos por sus victorias
    const sortedRanking = teamScores.sort((a, b) => b.totalVictories - a.totalVictories);

    res.status(200).json(sortedRanking);
  } catch (error) {
    console.error("Error al obtener ranking de equipos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
