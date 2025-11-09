import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, checkToken } from "../services/Token.services";
import { useToast } from "../hooks/useToast";
import Modal from "../components/Modal";

import "../styles/Torneos.css";
import "../styles/Ranking.css";

// Helper para la fecha/hora exacta del próximo domingo 23:59 (AR)
const getTournamentEndDate = () => {
  const now = new Date();
  const day = now.getDay(); // 0=Dom
  const daysUntilSunday = (7 - day) % 7 || 7; // si es domingo, apunta al próximo domingo
  const endDate = new Date(now);
  endDate.setDate(now.getDate() + daysUntilSunday);
  endDate.setHours(23, 59, 0, 0);
  return endDate.toLocaleString("es-AR", {
    weekday: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const Torneos = () => {
  const [currentRanking, setCurrentRanking] = useState([]);
  const [hallOfFame, setHallOfFame] = useState([]);
  const [history, setHistory] = useState([]);

  const [selectedTournament, setSelectedTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigate = useNavigate();
  const { showErrorToast } = useToast();

  const tournamentEndDate = getTournamentEndDate();

  useEffect(() => {
    const token = getToken(navigate);
    if (!token) return;

    const fetchAllData = async () => {
      setLoading(true);
      try {
        const [rankingRes, hofRes, historyRes] = await Promise.all([
          fetch("http://localhost:3000/ranking/team_weekly", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3000/tournaments/hall_of_fame", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3000/tournaments", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        checkToken(rankingRes, navigate);
        checkToken(hofRes, navigate);
        checkToken(historyRes, navigate);

        const rankingData = await rankingRes.json();
        const hofData = await hofRes.json();
        const historyData = await historyRes.json();

        setCurrentRanking(rankingData);
        setHallOfFame(hofData);
        setHistory(historyData);
      } catch (err) {
        showErrorToast(err.message || "Error al cargar datos del torneo");
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, [navigate, showErrorToast]);

  const handleHistoryClick = async (id) => {
    const token = getToken(navigate);
    if (!token) return;
    try {
      const response = await fetch(`http://localhost:3000/tournaments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      checkToken(response, navigate);
      const data = await response.json();
      setSelectedTournament(data);
      setIsModalOpen(true);
    } catch (err) {
      showErrorToast(err.message || "Error al cargar el torneo");
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTournament(null);
  };

  return (
    <div className="torneos-container">
      <h1>Torneos de Equipos</h1>

      {loading ? (
        <h1 className="ranking-loading">Cargando datos...</h1>
      ) : (
        <>
          {/* --- SECCIÓN 1: TORNEO ACTUAL --- */}
          <div className="torneo-actual-card">
            <div className="torneo-actual-header">
              <h2>Torneo Semanal Actual</h2>
              <div className="torneo-countdown">Finaliza: {tournamentEndDate}</div>
            </div>
            <RenderTeamTable data={currentRanking} />
          </div>

          {/* --- SECCIÓN 2: SALÓN DE LA FAMA --- */}
          <div
            className="torneo-actual-card"
            style={{ borderColor: "var(--profile-glow-secondary)", marginTop: "3rem" }}
          >
            <div className="torneo-actual-header">
              <h2 style={{ color: "var(--profile-glow-secondary)" }}>Salón de la Fama</h2>
            </div>
            <RenderHallOfFameTable data={hallOfFame} />
          </div>

          {/* --- SECCIÓN 3: HISTORIAL DE TORNEOS --- */}
          <div className="torneo-actual-card" style={{ marginTop: "3rem" }}>
            <div className="torneo-actual-header">
              <h2>Historial de Torneos Pasados</h2>
            </div>
            <div className="torneo-lista">
              {history.length === 0 ? (
                <p style={{ color: "#aaa" }}>Aún no se ha completado ningún torneo.</p>
              ) : (
                history.map((torneo) => (
                  <div
                    key={torneo.id}
                    className="torneo-item"
                    onClick={() => handleHistoryClick(torneo.id)}
                  >
                    {torneo.name}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <button
        className="profile-button"
        style={{ marginTop: "3rem" }}
        onClick={() => navigate("/play")}
      >
        Volver al Juego
      </button>

      {/* --- Modal Historial --- */}
      <Modal isOpen={isModalOpen} onClose={closeModal}>
        {selectedTournament ? (
          <div
            className="ranking-table-container"
            style={{ maxWidth: "100%", backdropFilter: "none", boxShadow: "none" }}
          >
            <h1 style={{ fontSize: "2rem" }}>{selectedTournament.name}</h1>
            <RenderTournamentResults data={selectedTournament.results || []} />
          </div>
        ) : (
          <p>Cargando resultados...</p>
        )}
      </Modal>
    </div>
  );
};

// --- Componentes Hijos ---

// 1. Tabla del Ranking ACTUAL (usa 'team.name')
const RenderTeamTable = ({ data }) => (
  <table className="ranking-table">
    <thead>
      <tr>
        <th className="center">#</th>
        <th>Equipo</th>
        <th className="center">Victorias (Semanal)</th>
        <th className="center">Derrotas (Semanal)</th>
        <th className="center">Victorias %</th>
      </tr>
    </thead>
    <tbody>
      {!data || data.length === 0 ? (
        <tr>
          <td colSpan="5" style={{ textAlign: "center", color: "#aaa" }}>
            Ningún equipo ha jugado esta semana.
          </td>
        </tr>
      ) : (
        data.map((stat, index) => (
          <tr key={stat.id ?? `${stat.team?.name}-${index}`}>
            <td className="center">{index + 1}</td>
            <td>{stat.team ? stat.team.name : "Equipo Desconocido"}</td>
            <td className="center">{stat.gameswon}</td>
            <td className="center">{stat.gameslost}</td>
            <td className="center winrate">
              {typeof stat.winrate === "number"
                ? stat.winrate.toFixed(1)
                : Number(stat.winrate || 0).toFixed(1)}
              %
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
);

// 2. Tabla del Salón de la Fama
const RenderHallOfFameTable = ({ data }) => (
  <table className="ranking-table">
    <thead>
      <tr>
        <th className="center">#</th>
        <th>Equipo</th>
        <th className="center">Torneos Ganados</th>
      </tr>
    </thead>
    <tbody>
      {!data || data.length === 0 ? (
        <tr>
          <td colSpan="3" style={{ textAlign: "center", color: "#aaa" }}>
            Aún no se ha completado ningún torneo.
          </td>
        </tr>
      ) : (
        data.map((team, index) => (
          <tr key={team.teamId}>
            <td className="center">{index + 1}</td>
            <td>{team.name}</td>
            <td className="center" style={{ color: "#FFD700", fontWeight: 700 }}>
              {team.wins} 🏆
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
);

// 3. Tabla del Historial (Modal)
const RenderTournamentResults = ({ data }) => (
  <table className="ranking-table">
    <thead>
      <tr>
        <th className="center">#</th>
        <th>Equipo</th>
        <th className="center">Ganadas</th>
        <th className="center">Perdidas</th>
        <th className="center">Victorias %</th>
      </tr>
    </thead>
    <tbody>
      {!data || data.length === 0 ? (
        <tr>
          <td colSpan="5" style={{ textAlign: "center", color: "#aaa" }}>
            Este torneo no tuvo participantes.
          </td>
        </tr>
      ) : (
        data.map((team) => (
          <tr key={team.teamId}>
            <td className="center">{team.rank}</td>
            <td>{team.name}</td>
            <td className="center">{team.gameswon}</td>
            <td className="center">{team.gameslost}</td>
            <td className="center winrate">
              {typeof team.winrate === "number"
                ? team.winrate.toFixed(1)
                : Number(team.winrate || 0).toFixed(1)}
              %
            </td>
          </tr>
        ))
      )}
    </tbody>
  </table>
);

export default Torneos;
