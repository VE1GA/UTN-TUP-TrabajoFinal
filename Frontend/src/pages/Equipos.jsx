import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getToken, checkToken } from "../services/Token.services";
import { useToast } from "../hooks/useToast";

import "../styles/Equipos.css";

const Teams = () => {
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- NUEVO ESTADO ---
  // Guardará el ID del equipo al que pertenece el usuario (o null si no)
  const [userTeamId, setUserTeamId] = useState(null);

  const navigate = useNavigate();
  const { showSuccessToast, showErrorToast } = useToast();

  const currentUser = useMemo(() => {
    const userString = localStorage.getItem("user");
    return userString ? JSON.parse(userString) : null;
  }, []);

  // --- FUNCIÓN DE OBTENER EQUIPOS (MODIFICADA) ---
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

      // --- LÓGICA AÑADIDA ---
      // Después de cargar los equipos, buscamos si el usuario está en uno
      let foundTeamId = null;
      if (currentUser) {
        for (const team of data) {
          if (team.players.some((player) => player.id === currentUser.id)) {
            foundTeamId = team.id;
            break; // Encontramos el equipo, salimos del bucle
          }
        }
      }
      setUserTeamId(foundTeamId); // Guardamos el ID (o null)
      // --- FIN DE LÓGICA AÑADIDA ---
    } catch (err) {
      console.error("Error fetching teams:", err);
      setError(err.message || "Error al cargar equipos");
      showErrorToast(err.message || "Error al cargar equipos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [navigate]); // No añadimos currentUser a propósito para evitar recargas

  // ... (handleCreateTeam sigue igual) ...
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
        setNewTeamName("");
        await fetchTeams(); // Esperamos a que recargue
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al crear el equipo");
      }
    } catch (err) {
      console.error("Error creating team:", err);
      showErrorToast(err.message);
    }
  };

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
      await fetchTeams(); // Esperamos a que recargue
    } catch (err) {
      const errorData = (await err.response?.json()) || { message: err.message };
      showErrorToast(errorData.message || "Error al unirse al equipo");
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
      await fetchTeams(); // Esperamos a que recargue
    } catch (err) {
      showErrorToast(err.message || "Error al abandonar el equipo");
    }
  };

  const handleDeleteTeam = async (teamId, teamName) => {
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
      await fetchTeams(); // Esperamos a que recargue
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
  if (!currentUser) {
    return (
      <div className="equipos-container">
        <h1 className="equipos-error">Error: No se pudo cargar el usuario.</h1>
      </div>
    );
  }

  const isManager = currentUser.role === "EVENTMANAGER" || currentUser.role === "ADMIN";

  return (
    <div className="equipos-container">
      <h1>Equipos</h1>

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

      <h2>Equipos Existentes ({teams.length})</h2>

      <div className="equipos-grid">
        {teams.map((team) => {
          // --- LÓGICA DE BOTONES MODIFICADA ---

          // 1. ¿Es el usuario miembro de ESTE equipo?
          const esMiembro = team.id === userTeamId;
          // 2. ¿Es el usuario el manager de ESTE equipo?
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

              <div className="team-actions">
                {/* 1. Botón UNIRSE:
                       Solo se muestra si el usuario NO tiene equipo (userTeamId es null) */}
                {!userTeamId && (
                  <button
                    className="team-button team-button-join"
                    onClick={() => handleJoinTeam(team.id)}
                  >
                    Unirse
                  </button>
                )}

                {/* 2. Botón ABANDONAR:
                       Solo se muestra si el usuario es miembro de ESTE equipo.
                       (Ya no chequea !esElManager) */}
                {esMiembro && (
                  <button
                    className="team-button team-button-leave"
                    onClick={() => handleLeaveTeam(team.id)}
                  >
                    Abandonar
                  </button>
                )}

                {/* 3. Botón ELIMINAR:
                       Se muestra si eres el manager O un admin. */}
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
