import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, checkToken } from "../services/Token.services";
import { useToast } from "../hooks/useToast"; // Importamos el hook de notificaciones

// Importamos el archivo CSS
import "../styles/Equipos.css";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useToast();

  // Obtenemos el usuario actual de localStorage para saber su rol e ID
  const currentUser = useMemo(() => {
    const userString = localStorage.getItem("user");
    return userString ? JSON.parse(userString) : null;
  }, []);

  // --- 1. FUNCIÓN PARA OBTENER LOS EQUIPOS ---
  const fetchTeams = async () => {
    const token = getToken(navigate);
    if (!token) return;

    try {
      setError(null);
      const response = await fetch("http://localhost:3000/teams", {
        headers: { Authorization: `Bearer ${token}` },
      });
      checkToken(response, navigate);
      const data = await response.json();
      setTeams(data);
    } catch (err) {
      console.error("Error fetching teams:", err);
      setError(err.message || "Error al cargar equipos");
      showErrorToast(err.message || "Error al cargar equipos");
    } finally {
      setLoading(false);
    }
  };

  // Cargar los equipos al iniciar el componente
  useEffect(() => {
    fetchTeams();
  }, [navigate]);

  // --- 2. FUNCIÓN PARA CREAR UN EQUIPO (SOLO EVENT MANAGER) ---
  const handleCreateTeam = async (e) => {
    e.preventDefault();
    if (newTeamName.trim() === "") {
      showErrorToast("El nombre del equipo no puede estar vacío.");
      return;
    }

    const token = getToken(navigate);
    if (!token) return;

    try {
      const response = await fetch("http://localhost:3000/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newTeamName }),
      });
      checkToken(response, navigate);

      if (response.status === 201) {
        showSuccessToast(`Equipo "${newTeamName}" creado con éxito.`);
        setNewTeamName(""); // Limpiar el input
        fetchTeams(); // Recargar la lista de equipos
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear el equipo");
      }
    } catch (err) {
      console.error("Error creating team:", err);
      showErrorToast(err.message);
    }
  };

  // --- 3. FUNCIONES DE ACCIÓN (UNIRSE, ABANDONAR, ELIMINAR) ---

  const handleJoinTeam = async (teamId) => {
    const token = getToken(navigate);
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3000/teams/join/${teamId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      checkToken(response, navigate);
      const data = await response.json();
      showSuccessToast(data.message);
      fetchTeams(); // Recargar lista
    } catch (err) {
      showErrorToast(err.message || "Error al unirse al equipo");
    }
  };

  const handleLeaveTeam = async (teamId) => {
    const token = getToken(navigate);
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3000/teams/leave/${teamId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      checkToken(response, navigate);
      const data = await response.json();
      showSuccessToast(data.message);
      fetchTeams(); // Recargar lista
    } catch (err) {
      showErrorToast(err.message || "Error al abandonar el equipo");
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
    // Doble confirmación para una acción destructiva
    if (
      !window.confirm(
        `¿Estás seguro de que quieres eliminar el equipo "${teamName}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    const token = getToken(navigate);
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:3000/teams/${teamId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      checkToken(response, navigate);
      const data = await response.json();
      showSuccessToast(data.message);
      fetchTeams(); // Recargar lista
    } catch (err) {
      showErrorToast(err.message || "Error al eliminar el equipo");
    }
  };

  // --- RENDERIZADO ---

  if (loading) {
    return (
      <div className="equipos-container">
        <h1 className="equipos-loading">Cargando equipos...</h1>
      </div>
    );
  }

  if (error) {
    return (
      <div className="equipos-container">
        <h1 className="equipos-error">Error: {error}</h1>
      </div>
    );
  }

  // Verificamos si el usuario es manager o admin
  const isManager = currentUser.role === "EVENTMANAGER" || currentUser.role === "ADMIN";

  return (
    <div className="equipos-container">
      <h1>Equipos</h1>

      {/* --- FORMULARIO DE CREACIÓN (SOLO PARA MANAGERS) --- */}
      {isManager && (
        <form className="create-team-form" onSubmit={handleCreateTeam}>
          <h3>Crear un Nuevo Equipo</h3>
          <input
            type="text"
            className="create-team-input"
            placeholder="Nombre del nuevo equipo"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
          />
          <button type="submit" className="create-team-button">
            Crear Equipo
          </button>
        </form>
      )}

      <h2>Equipos Disponibles ({teams.length})</h2>

      {/* --- LISTA DE EQUIPOS --- */}
      <div className="equipos-grid">
        {teams.map((team) => {
          // Verificamos si el usuario actual es miembro
          const esMiembro = team.players.some((player) => player.id === currentUser.id);
          // Verificamos si el usuario actual es el manager de ESTE equipo
          const esElManager = team.manager.id === currentUser.id;

          return (
            <div key={team.id} className="team-card">
              <h3>{team.name}</h3>
              <p className="team-card-manager">
                Manager: <strong>{team.manager.name}</strong>
              </p>

              <div className="team-members">
                <h4>Miembros ({team.players.length})</h4>
                {team.players.length > 0 ? (
                  <ul>
                    {team.players.map((player) => (
                      <li key={player.id}>{player.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p>Aún no hay miembros.</p>
                )}
              </div>

              {/* --- BOTONES DE ACCIÓN --- */}
              <div className="team-actions">
                {!esMiembro && (
                  <button
                    className="team-button team-button-join"
                    onClick={() => handleJoinTeam(team.id)}
                  >
                    Unirse
                  </button>
                )}

                {esMiembro &&
                  !esElManager && ( // Un manager no puede "abandonar" su propio equipo
                    <button
                      className="team-button team-button-leave"
                      onClick={() => handleLeaveTeam(team.id)}
                    >
                      Abandonar
                    </button>
                  )}

                {/* Solo el manager de este equipo o un Admin pueden eliminar */}
                {(esElManager || currentUser.role === "ADMIN") && (
                  <button
                    className="team-button team-button-delete"
                    onClick={() => handleDeleteTeam(team.id, team.name)}
                  >
                    Eliminar Equipo
                  </button>
                )}
              </div>
            </div>
          );
        })}
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

export default Teams;
