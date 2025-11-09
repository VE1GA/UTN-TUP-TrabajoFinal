import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import RegisterForm from "../components/RegisterForm";
import { Validations } from "../utils/Validations";

import { toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Aunque ya esté en App.jsx, es buena práctica tenerlo.

import "../styles/Login.css";

const Register = () => {
  const nameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const navigate = useNavigate();

  const [errores, setErrores] = useState({});

  const toastConfig = {
    position: "bottom-center",
    autoClose: 2500,
    theme: "dark",
    transition: Slide,
  };

  const manejarEnvio = async (FormData) => {
    const errores = await Validations(FormData, "register");

    if (Object.keys(errores).length > 0) {
      if (errores.name && nameRef.current) {
        nameRef.current.focus();
      } else if ((errores.email || errores.repetido) && emailRef.current) {
        emailRef.current.focus();
      } else if (errores.password && passwordRef.current) {
        passwordRef.current.focus();
      } else if (errores.confirmPassword && confirmPasswordRef.current) {
        confirmPasswordRef.current.focus();
      }

      setErrores(errores);
    } else {
      setErrores({});

      await fetch("http://localhost:3000/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(FormData),
      })
        .then((res) => res.json())

        .then((data) => {
          console.info("Usuario registrado:", data);
          toast.success(data.message || "Usuario registrado con éxito!", toastConfig);
        })

        .catch((error) => {
          console.error("Ocurrió un error:", error);
          toast.error("Ocurrió un error al registrar. Intente nuevamente.", toastConfig);
        });

      setTimeout(() => {
        navigate("/play");
      }, 2500);
    }
  };

  return (
    <>
      <div>
        <RegisterForm
          onSubmit={manejarEnvio}
          errores={errores}
          refs={{ nameRef, emailRef, passwordRef, confirmPasswordRef }}
        />
      </div>
    </>
  );
};

export default Register;
