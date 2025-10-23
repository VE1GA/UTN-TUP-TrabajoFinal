import "bootstrap/dist/css/bootstrap.min.css";
import "react-toastify/dist/ReactToastify.css";
import "./styles/App.css";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";

// prettier-ignore
import {Home, Login, Register, Wordle, Perfil, Equipos, Ranking, AdminDashboard, NotFound} from "./pages";

import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/*" element={<NotFound />} />

          <Route path="/ranking" element={<Ranking />} />
          <Route path="/equipos" element={<Equipos />} />
          <Route path="/perfil" element={<Perfil />} />

          <Route path="/registrarse" element={<Register />} />
          <Route path="/iniciar_sesion" element={<Login />} />

          <Route
            path="/admin_dashboard/*"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/play"
            element={
              <ProtectedRoute allowedRoles={["USER", "EVENTMANAGER"]}>
                <Wordle />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>

      <ToastContainer />
    </>
  );
}

export default App;
