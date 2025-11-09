import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/useToast";
import "../styles/LogoutButton.css";

const LogoutButton = () => {
  const navigate = useNavigate();
  const { showSuccessToast } = useToast();

  const handleLogout = () => {
    // 1. Borramos los datos de sesión del localStorage
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");

    // 2. Mostramos una notificación (opcional pero recomendado)
    showSuccessToast("Sesión cerrada exitosamente.");

    // 3. Redirigimos al login
    // 'replace: true' evita que el usuario pueda "volver" a la página protegida
    navigate("/iniciar_sesion", { replace: true });
  };

  return (
    <button className="logout-button" onClick={handleLogout}>
      Cerrar Sesión
    </button>
  );
};

export default LogoutButton;
