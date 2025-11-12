import cron from "node-cron";
import { Tournament, Stat, Team } from "../db.js";
import { Op } from "sequelize";
import { UserRoles } from "../enums/enums.js";

/**
 * Utilidad: normaliza el campo teamsInfo a array
 */
const toResultsArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

/**
 * Utilidad: Chequea roles de Admin/Manager
 */
const checkManagerAdmin = (req, res) => {
  const userRole = req.user.role;
  if (userRole !== UserRoles.EVENTMANAGER && userRole !== UserRoles.ADMIN) {
    res.status(403).json({
      message: "Acceso denegado. Se requiere rol de Event Manager o Administrador.",
    });
    return false;
  }
  return true;
};

/**
 * Asegura que exista un torneo "actual" (vacío) cuando el server arranca.
 * Si ya existe un registro con teamsInfo vacío al final, lo reutiliza; si el último
 * ya tiene snapshot (es decir, terminó), crea uno nuevo para la semana que empieza.
 */
const ensureCurrentTournamentExists = async () => {
  // último torneo por id
  const last = await Tournament.findOne({ order: [["id", "DESC"]] });

  if (!last) {
    const name = `Torneo Semanal - Inicia ${new Date().toLocaleString("es-AR")}`;
    await Tournament.create({
      name,
      teamsInfo: [], // array vacío
    });
    console.log(`[Init] No había torneos. Creado "${name}".`);
    return;
  }

  const lastResults = toResultsArray(last.teamsInfo);
  if (lastResults.length === 0) {
    // ya hay torneo "abierto" (sin snapshot)
    console.log("[Init] Ya existe torneo actual sin snapshot. OK.");
    return;
  }

  // si el último ya tiene snapshot, creamos el de la nueva semana
  const name = `Torneo Semanal - Inicia ${new Date().toLocaleString("es-AR")}`;
  await Tournament.create({
    name,
    teamsInfo: [],
  });
  console.log(`[Init] Último torneo tenía snapshot. Creado nuevo "${name}".`);
};

// --- 1. HISTORIAL: OBTENER LISTA DE TORNEOS PASADOS (SIN CAMBIOS) ---
export const getAllTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.findAll({
      attributes: ["id", "name"],
      order: [["id", "DESC"]],
      offset: 1, // Nos saltamos el primero (el actual)
    });
    res.status(200).json(tournaments);
  } catch (error) {
    console.error("Error al obtener lista de torneos:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// --- 2. HISTORIAL: OBTENER DETALLE (CORREGIDO) ---
export const getTournamentById = async (req, res) => {
  const { id } = req.params;
  try {
    const tournament = await Tournament.findByPk(id, {
      attributes: ["id", "name", "teamsInfo"],
    });

    if (!tournament) {
      return res.status(404).json({ message: "Torneo no encontrado" });
    }

    const parsedTournament = {
      id: tournament.id,
      name: tournament.name,
      results: toResultsArray(tournament.teamsInfo),
    };

    res.status(200).json(parsedTournament);
  } catch (error) {
    console.error("Error al obtener detalle del torneo:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// --- 3. SALÓN DE LA FAMA (CORREGIDO) ---
export const getTournamentHallOfFame = async (req, res) => {
  try {
    const completedTournaments = await Tournament.findAll({
      where: {
        [Op.and]: [{ teamsInfo: { [Op.ne]: null } }, { teamsInfo: { [Op.ne]: "[]" } }],
      },
      attributes: ["teamsInfo"],
      order: [["id", "ASC"]],
    });

    if (!completedTournaments.length) {
      return res.status(200).json([]);
    }

    const winsCount = {};
    for (const torneo of completedTournaments) {
      const results = toResultsArray(torneo.teamsInfo);
      if (results.length > 0) {
        // ganador = primer lugar (mayor gameswon al cierre)
        const winner = results[0];
        winsCount[winner.teamId] = {
          teamId: winner.teamId,
          name: winner.name,
          wins: (winsCount[winner.teamId]?.wins || 0) + 1,
        };
      }
    }

    const hallOfFameArray = Object.values(winsCount);
    const sortedHallOfFame = hallOfFameArray.sort((a, b) => b.wins - a.wins);
    res.status(200).json(sortedHallOfFame);
  } catch (error) {
    console.error("Error al obtener Salón de la Fama:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// --- 4. CRON JOB (LÓGICA COMPLETAMENTE CORREGIDA) ---
const cycleWeeklyTournament = async () => {
  console.log("[Cron Job] Iniciando ciclo de torneo semanal...");
  try {
    // 1) Snapshot del ranking semanal de equipos (semana que termina)
    const teamStats = await Stat.findAll({
      where: {
        teamId: { [Op.not]: null },
        weekly_gamesplayed: { [Op.gt]: 0 }, // <-- Lee campos Semanales
      },
      include: { model: Team, attributes: ["name"] },
      order: [
        ["weekly_gameswon", "DESC"], // <-- Lee campos Semanales
        ["weekly_winrate", "DESC"], // <-- Lee campos Semanales
      ],
    });

    const snapshot = teamStats.map((stat, index) => ({
      rank: index + 1,
      teamId: stat.teamId,
      name: stat.team ? stat.team.name : "Equipo Desconocido",
      gameswon: stat.weekly_gameswon, // <-- Guarda campos Semanales
      gameslost: stat.weekly_gameslost, // <-- Guarda campos Semanales
      winrate: stat.weekly_winrate, // <-- Guarda campos Semanales
    }));

    // 2) Buscar el torneo "abierto" (último registro)
    let currentTournament = await Tournament.findOne({
      order: [["id", "DESC"]],
    });

    // 3) Primera ejecución: si no hay ninguno, creamos uno inaugural
    if (!currentTournament) {
      console.log("[Cron Job] Primera ejecución. Creando torneo inaugural para guardar snapshot.");
      currentTournament = await Tournament.create({
        name: `Torneo Inaugural (Termina ${new Date().toLocaleString("es-AR")})`,
        teamsInfo: [],
      });
    }

    // 4) Guardar snapshot en el torneo que acaba de terminar
    currentTournament.teamsInfo = snapshot;
    await currentTournament.save();
    console.log(`[Cron Job] Torneo ${currentTournament.name} finalizado y guardado.`);

    // 5) Resetear SOLAMENTE las estadísticas semanales de equipos
    await Stat.update(
      { weekly_gamesplayed: 0, weekly_gameswon: 0, weekly_gameslost: 0, weekly_winrate: 0 },
      { where: { teamId: { [Op.not]: null } } }
    );
    console.log("[Cron Job] Estadísticas SEMANALES de equipos reseteadas.");

    // 6) Crear el NUEVO torneo para la semana que empieza
    const newDate = new Date();
    const tournamentName = `Torneo Semanal - Inicia ${newDate.toLocaleString("es-AR")}`;
    await Tournament.create({
      name: tournamentName,
      teamsInfo: [],
    });
    console.log(`[Cron Job] Nuevo torneo "${tournamentName}" creado.`);
  } catch (error) {
    console.error("[Cron Job] Error en el ciclo del torneo:", error);
  }
};

// --- 5. INICIALIZADOR DEL CRON JOB ---
export const initializeCronJobs = async () => {
  await ensureCurrentTournamentExists();

  // Producción: "59 23 * * 0" => Domingo 23:59 (zona AR)
  cron.schedule("* * * * *", cycleWeeklyTournament, {
    scheduled: true,
    timezone: "America/Argentina/Buenos_Aires",
  });

  console.log("[INFO] Tarea programada de torneos (Domingos 23:59) inicializada.");
};

// --- 6. ELIMINAR UN TORNEO (CORREGIDO) ---
export const deleteTournament = async (req, res) => {
  // 1. Verificar permisos
  if (!checkManagerAdmin(req, res)) return;

  const { id } = req.params;
  try {
    // 2. Buscar el torneo a eliminar
    const tournament = await Tournament.findByPk(id);
    if (!tournament) {
      return res.status(404).json({ message: "Torneo no encontrado." });
    }

    // 3. Buscar el torneo "actual" (el que tiene el ID más alto)
    const currentTournament = await Tournament.findOne({
      order: [["id", "DESC"]],
    });

    // 4. Comprobar si el ID a borrar es el del torneo actual
    if (currentTournament && tournament.id === currentTournament.id) {
      return res.status(400).json({ message: "No se puede eliminar el torneo semanal actual." });
    }

    // 5. Borrar
    await tournament.destroy();
    res.status(200).json({ message: "Historial de torneo eliminado correctamente." });
  } catch (error) {
    console.error("Error al eliminar el torneo:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
