import { Router } from "express";

import * as auth from "../services/auth.services.js";
import * as words from "../services/words.services.js";
import * as users from "../services/user.services.js";
import * as stats from "../services/stats.services.js";
import * as team from "../services/team.services.js";
import * as ranking from "../services/ranking.services.js";
import * as tournament from "../services/tournament.services.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

export const router = Router();

// Endpoints de autenticación y creación de cuentas
router.post("/register", auth.registerUser);
router.post("/login", auth.loginUser);
router.post("/check_repeat", auth.usuarioRepetido);

// Endpoints de cuentas de usuarios
router.get("/users", verifyToken, users.getUserList);
router.delete("/users/:id", verifyToken, users.DeleteUser);
router.put("/users/:id", verifyToken, users.EditExistingUser);

// Endpoints del banco de palabras
router.post("/words", verifyToken, words.createNewWord);
router.get("/words", verifyToken, words.getWordList);
router.delete("/words/:id", verifyToken, words.DeleteWord);
router.put("/words/:id", verifyToken, words.EditExistingWord);

// Endpoints de Estadísticas
router.post("/save_game", verifyToken, stats.saveGameResult);
router.get("/my_stats", verifyToken, stats.getMyStats);

// Endpoints de equipo
router.get("/teams", verifyToken, team.getAllTeams);
router.post("/teams/join/:teamId", verifyToken, team.joinTeam);
router.delete("/teams/leave/:teamId", verifyToken, team.leaveTeam);

router.post("/teams", verifyToken, team.createTeam);
router.delete("/teams/:teamId", verifyToken, team.deleteTeam);

// Endpoints de ranking
router.get("/ranking/individual", verifyToken, ranking.getIndividualRanking);
router.get("/ranking/team", verifyToken, ranking.getTeamRanking);
router.get("/ranking/team_weekly", verifyToken, ranking.getTeamWeeklyRanking);

// Endpoints de Torneos
router.get("/tournaments/hall_of_fame", verifyToken, tournament.getTournamentHallOfFame);
router.get("/tournaments", verifyToken, tournament.getAllTournaments);
router.get("/tournaments/:id", verifyToken, tournament.getTournamentById);

export default router;
