import { Stat, User, TeamPlayer } from "../db.js";
import { Op } from "sequelize";

const esDiaConsecutivo = (fechaHoy, fechaUltimaVictoria) => {
  if (!fechaUltimaVictoria) return false;
  const hoy = new Date(fechaHoy);
  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  const ultimaVictoria = new Date(fechaUltimaVictoria);
  return (
    ayer.getFullYear() === ultimaVictoria.getFullYear() &&
    ayer.getMonth() === ultimaVictoria.getMonth() &&
    ayer.getDate() === ultimaVictoria.getDate()
  );
};

const yaGanoHoy = (fechaHoy, fechaUltimaVictoria) => {
  if (!fechaUltimaVictoria) return false;
  const hoy = new Date(fechaHoy);
  const ultimaVictoria = new Date(fechaUltimaVictoria);
  return (
    hoy.getFullYear() === ultimaVictoria.getFullYear() &&
    hoy.getMonth() === ultimaVictoria.getMonth() &&
    hoy.getDate() === ultimaVictoria.getDate()
  );
};

export const saveGameResult = async (req, res) => {
  const userId = req.user.id; // Viene del verifyToken
  const { didWin, attemptsCount } = req.body; // Del frontend

  try {
    const playerStats = await Stat.findOne({ where: { userId } }); // Renombrado a playerStats
    if (!playerStats) {
      return res.status(404).json({ message: "Estadísticas no encontradas" });
    }

    // --- LÓGICA DE JUGADOR (SIN CAMBIOS) ---
    playerStats.gamesplayed += 1;
    const fechaHoy = new Date().toISOString().split("T")[0];
    const ultimaVictoria = playerStats.lastWinDate;

    if (didWin) {
      playerStats.gameswon += 1;
      const currentAttempts = playerStats.attempts || [];
      playerStats.attempts = [...currentAttempts, attemptsCount];

      if (yaGanoHoy(fechaHoy, ultimaVictoria)) {
      } else if (esDiaConsecutivo(fechaHoy, ultimaVictoria)) {
        playerStats.streak += 1;
        playerStats.lastWinDate = fechaHoy;
      } else {
        playerStats.streak = 1;
        playerStats.lastWinDate = fechaHoy;
      }
    } else {
      playerStats.gameslost += 1;
      playerStats.streak = 0;
    }

    playerStats.winrate = (playerStats.gameswon / playerStats.gamesplayed) * 100;
    await playerStats.save();

    // --- LÓGICA PARA GUARDAR EN EQUIPOS (MODIFICADA) ---
    const membership = await TeamPlayer.findOne({ where: { userId } });

    if (membership) {
      const teamId = membership.teamId;
      const teamStats = await Stat.findOne({ where: { teamId } });

      if (teamStats) {
        // 1. Actualizar estadísticas HISTÓRICAS (nunca se borran)
        teamStats.gamesplayed += 1;

        // 2. Actualizar estadísticas SEMANALES (se borran con el cron)
        teamStats.weekly_gamesplayed += 1;

        if (didWin) {
          teamStats.gameswon += 1; // Histórico
          teamStats.weekly_gameswon += 1; // Semanal
        } else {
          teamStats.gameslost += 1; // Histórico
          teamStats.weekly_gameslost += 1; // Semanal
        }

        // 3. Calcular Winrates para ambos
        teamStats.winrate = (teamStats.gameswon / teamStats.gamesplayed) * 100;
        teamStats.weekly_winrate = (teamStats.weekly_gameswon / teamStats.weekly_gamesplayed) * 100;

        await teamStats.save();
        console.log(
          `[Stats] Estadísticas (Históricas y Semanales) del equipo ${teamId} actualizadas.`
        );
      }
    }

    res.status(200).json({ message: "Estadísticas actualizadas", playerStats });
  } catch (error) {
    console.error("Error al guardar estadísticas:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const getMyStats = async (req, res) => {
  const userId = req.user.id; // Viene del verifyToken

  try {
    // Buscamos las estadísticas y le pedimos que incluya el modelo User
    const stats = await Stat.findOne({
      where: { userId },
      include: [
        {
          model: User,
          attributes: ["name", "email", "role"], // Solo traemos estos datos
        },
      ],
    });

    if (!stats) {
      return res.status(404).json({ message: "No se encontraron estadísticas para este usuario." });
    }

    res.status(200).json(stats);
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
