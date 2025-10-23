import "react-toastify/dist/ReactToastify.css";

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

// Quitamos Form porque ya no usamos el Form.Check
import * as Icon from "react-bootstrap-icons";
import { toast, Slide } from "react-toastify";

import { getToken, checkToken } from "../../services/Token.services";
import { Validations } from "../../utils/Validations";

import { toastSuccessConfig, toastErrorConfig } from "../../pages/AdminDashboard";

const UsersForm = ({ userTemporal, getUsersList, onSaveSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER", // El estado ahora guarda el string del rol
  });
  const [errores, setErrores] = useState({});

  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const roleRef = useRef(null); // Ref para el <select>
  const navigate = useNavigate();

  const tipoLlamada = userTemporal.creando ? "Creando" : "Editando";

  let endpoint;
  let metodo;
  let mensaje;

  let token;

  useEffect(() => {
    setFormData({
      name: userTemporal.name,
      email: userTemporal.email,
      password: "", // Siempre vacía al cargar
      role: userTemporal.role || "USER", // Carga el rol existente
    });
  }, [userTemporal]);

  // Manejador único para todos los inputs (text, email, password, select)
  const changeHandler = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Archivo: frontend/components/dashboard/UsersForm.jsx

  const submitHandler = async (e) => {
    e.preventDefault();

    // Asumimos que Validations.js ya está ajustado para
    // permitir contraseña vacía en modo "edit"
    const errores = await Validations(formData, "edit");

    if (Object.keys(errores).length > 0) {
      if (errores.name && nameRef.current) {
        nameRef.current.focus();
        toast.error(errores.name, toastErrorConfig);
      } else if (errores.email && emailRef.current) {
        emailRef.current.focus();
        toast.error(errores.email, toastErrorConfig);
      } else if (errores.password && passwordRef.current) {
        // Esto solo saltará si escriben una contraseña inválida
        passwordRef.current.focus();
        toast.error(errores.password, toastErrorConfig);
      }
      setErrores(errores);
    } else {
      setErrores({});

      // --- ¡ESTA ES LA CORRECCIÓN CRÍTICA! ---
      // 1. Creamos el objeto base con los datos que siempre van
      const datosEnviar = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      };

      // 2. Solo añadimos la contraseña al objeto si el admin escribió una nueva
      if (formData.password.trim() !== "") {
        datosEnviar.password = formData.password;
      }
      // Si el campo está vacío, 'datosEnviar' no tendrá la key 'password',
      // y el backend no la actualizará.
      // --- FIN DE LA CORRECCIÓN ---

      if (tipoLlamada === "Creando") {
        endpoint = "http://localhost:3000/register";
        metodo = "POST";
        mensaje = "se creó correctamente";
      } else if (tipoLlamada === "Editando") {
        endpoint = `http://localhost:3000/users/${userTemporal.id}`;
        metodo = "PUT";
        mensaje = "se modificó correctamente";
        token = getToken(navigate);
      }

      const response = await fetch(endpoint, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(datosEnviar), // Enviamos el objeto corregido
      });

      checkToken(response, navigate);
      getUsersList();

      onSaveSuccess();
      toast.success(`Cuenta "${datosEnviar.name}" ${mensaje}`, toastErrorConfig);
    }
  };

  return (
    <form onSubmit={submitHandler} noValidate>
      <div>
        <h1> {userTemporal.creando ? "Creando usuario" : "Editando usuario"}</h1>

        <label>Nombre: </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={changeHandler}
          ref={nameRef}
        />
      </div>

      <div>
        <label>Email: </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={changeHandler}
          ref={emailRef}
        />
      </div>

      <div>
        <label>Contraseña: </label>
        <input
          type="password"
          name="password"
          // Añadimos placeholder para guiar al admin
          placeholder={tipoLlamada === "Editando" ? "(Dejar en blanco para no cambiar)" : ""}
          value={formData.password}
          onChange={changeHandler}
          ref={passwordRef}
        />
      </div>

      {/* --- Menú desplegable de Roles --- */}
      <div>
        <label>Rol: </label>
        <select name="role" value={formData.role} onChange={changeHandler} ref={roleRef}>
          <option value="USER">USER</option>
          <option value="ADMIN">ADMIN</option>
          <option value="EVENTMANAGER">EVENTMANAGER</option>
        </select>
      </div>
      {/* --- FIN del menú --- */}

      <button type="submit">
        <Icon.CheckCircleFill color="#0FC41A" size={40} />
      </button>
      <button type="button" onClick={onCancel}>
        {" "}
        {}
        <Icon.XCircleFill color="#FF3333" size={40} />
      </button>
    </form>
  );
};

export default UsersForm;
