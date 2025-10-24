import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, checkToken } from "../services/Token.services";
import { useToast } from "../hooks/useToast";

// Importamos el CSS
import "../styles/Ranking.css";

const Ranking = () => {
  const [view, setView] = useState("individual"); // 'individual' o 'team'
  const [individualRanking, setIndividualRanking] = useState([]);
  const [teamRanking, setTeamRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { showErrorToast } = useToast();

  useEffect(() => {
    const fetchRankings = async () => {
      const token = getToken(navigate);
      if (!token) return;

      setLoading(true);
      setError(null);

      try {
        // Hacemos ambas peticiones en paralelo
        const [individualRes, teamRes] = await Promise.all([
          fetch("http://localhost:3000/ranking/individual", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:3000/ranking/team", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // Verificamos tokens para ambas
        checkToken(individualRes, navigate);
        checkToken(teamRes, navigate);

        const individualData = await individualRes.json();
        const teamData = await teamRes.json();

        setIndividualRanking(individualData);
        setTeamRanking(teamData);
      } catch (err) {
        console.error("Error fetching rankings:", err);
        setError(err.message || "Error al cargar los rankings");
        showErrorToast(err.message || "Error al cargar los rankings");
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [navigate, showErrorToast]); // Añadimos showErrorToast a las dependencias

  // --- Renderizado ---

  if (loading) {
    return (
      <div className="ranking-container">
        <h1 className="ranking-loading">Cargando rankings...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ranking-container">
        <h1 className="ranking-error">Error: {error}</h1>
      </div>
    );
  }

  return (
    <div className="ranking-container">
      <h1>Clasificación</h1>

      {/* --- Interruptor (Toggle) --- */}
      <div className="ranking-toggle">
        <button
          className={`toggle-button ${view === "individual" ? "active" : ""}`}
          onClick={() => setView("individual")}
        >
          Individual
        </button>
        <button
          className={`toggle-button ${view === "team" ? "active" : ""}`}
          onClick={() => setView("team")}
        >
          Equipos
        </button>
      </div>

      {/* --- Contenedor de la Tabla --- */}
      <div className="ranking-table-container">
        {view === "individual" ? (
          <RenderIndividualTable data={individualRanking} />
        ) : (
          <RenderTeamTable data={teamRanking} />
        )}
      </div>

      <button
        className="profile-button"
        style={{ marginTop: "3rem" }}
        onClick={() => navigate("/play")}
      >
        Volver al Juego
      </button>
    </div>
  );
};

// --- Componente Hjo: Tabla Individual ---
const RenderIndividualTable = ({ data }) => {
  return (
    <table className="ranking-table">
      <thead>
        <tr>
          <th className="center">#</th>
          <th>Jugador</th>
          <th className="center">Ganadas</th>
          <th className="center">Perdidas</th>
          <th className="center">Victorias %</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan="5" style={{ textAlign: "center", color: "#aaa" }}>
              Aún no hay datos de ranking individual.
            </td>
          </tr>
        ) : (
          data.map((player, index) => (
            <tr key={player.id}>
              <td className="center">{index + 1}</td>
              <td>{player.user ? player.user.name : "Usuario Desconocido"}</td>
              <td className="center">{player.gameswon}</td>
              <td className="center">{player.gameslost}</td>
              <td className="center winrate">{player.winrate.toFixed(1)}%</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

// --- Componente Hjo: Tabla de Equipos ---
const RenderTeamTable = ({ data }) => {
  return (
    <table className="ranking-table">
      <thead>
        <tr>
          <th className="center">#</th>
          <th>Equipo</th>
          <th className="center">Victorias Totales</th>
          <th className="center">Derrotas Totales</th>
          <th className="center">Victorias %</th>
        </tr>
      </thead>
      <tbody>
        {data.length === 0 ? (
          <tr>
            <td colSpan="5" style={{ textAlign: "center", color: "#aaa" }}>
              Aún no hay datos de ranking de equipos.
            </td>
          </tr>
        ) : (
          data.map((team, index) => (
            <tr key={team.id}>
              <td className="center">{index + 1}</td>
              <td>{team.name}</td>
              <td className="center">{team.totalVictories}</td>
              <td className="center">{team.totalDefeats}</td>
              <td className="center winrate">{team.winrate.toFixed(1)}%</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
};

export default Ranking;
