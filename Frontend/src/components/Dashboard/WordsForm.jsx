import "react-toastify/dist/ReactToastify.css";

import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

import * as Icon from "react-bootstrap-icons";
import { toast, Slide } from "react-toastify";

import { Validations } from "../../utils/Validations";
import { toastSuccessConfig, toastErrorConfig } from "../../pages/AdminDashboard";

const WordsForm = ({ wordTemporal, getWordsList, onSaveSuccess, onCancel, wordList }) => {
  // Declaraciones
  const [formData, setFormData] = useState({
    value: "",
    luck: "",
  });
  const [errores, setErrores] = useState({});

  const valueRef = useRef(null);
  const luckRef = useRef(null);
  const navigate = useNavigate();

  const tipoLlamada = wordTemporal.creando ? "Creando" : "Editando";

  let endpoint;
  let metodo;
  let mensaje;

  // Rellenado de los campos
  useEffect(() => {
    setFormData({
      value: wordTemporal.value,
      luck: String(wordTemporal.luck),
    });
  }, [wordTemporal]);

  // Guardar los cambios
  const changeHandler = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Manejar lo que sucede al pulsar el botón "✅"
  const submitHandler = async (e) => {
    e.preventDefault();

    // --- LÓGICA CORREGIDA ---

    // 1. Validamos el formato (vacío, 5 letras, 0-100)
    const erroresValidacion = await Validations(formData, "words");

    if (Object.keys(erroresValidacion).length > 0) {
      // Si hay errores de formato (ej: campos vacíos)
      if (erroresValidacion.value && valueRef.current) {
        valueRef.current.focus();
        toast.error(erroresValidacion.value, toastErrorConfig);
      } else if (erroresValidacion.luck && luckRef.current) {
        luckRef.current.focus();
        toast.error(erroresValidacion.luck, toastErrorConfig);
      }
      setErrores(erroresValidacion);
      return; // Detenemos la ejecución aquí
    }

    // 2. Si el formato es OK, validamos la duplicidad (solo al crear)
    if (wordTemporal.creando) {
      const palabraRepetida = wordList.find(
        (word) => word.value.toUpperCase() === formData.value.toUpperCase()
      );

      if (palabraRepetida) {
        toast.error("Esta palabra ya existe en el banco de palabras", toastErrorConfig);
        valueRef.current.focus();
        setErrores({ repetida: true }); // Marcamos el error
        return; // Detenemos la ejecución aquí
      }
    }

    // 3. Si todo está OK, continuamos con el envío
    setErrores({}); // Limpiamos errores

    if (tipoLlamada === "Creando") {
      endpoint = "http://localhost:3000/words";
      metodo = "POST";
      mensaje = "se añadió correctamente";
    } else if (tipoLlamada === "Editando") {
      endpoint = `http://localhost:3000/words/${wordTemporal.id}`;
      metodo = "PUT";
      mensaje = "se modificó correctamente";
    }

    const payload = {
      value: formData.value.toUpperCase(),
      luck: formData.luck,
    };

    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No token found. Redirecting to login.");
      navigate("/iniciar_sesion");
      return;
    }
    console.log(`[WordsForm - ${tipoLlamada}] Enviando token:`, token);

    try {
      const response = await fetch(endpoint, {
        method: metodo,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.error("Token invalid or expired. Redirecting to login.");
          localStorage.removeItem("authToken");
          localStorage.removeItem("user");
          navigate("/iniciar_sesion");
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      await getWordsList();
      onSaveSuccess();
      toast.success(`Palabra "${formData.value}" ${mensaje}`, toastSuccessConfig);
    } catch (error) {
      console.error("Error submitting word:", error);
      toast.error(error.message || "Error al guardar la palabra.", toastErrorConfig);
    }
  };

  return (
    <form onSubmit={submitHandler} noValidate>
      <h1> {wordTemporal.creando ? "Creando palabra" : "Editando palabra"} </h1>

      <div>
        <label>Valor: </label>
        <input
          type="text"
          name="value"
          value={formData.value}
          onChange={changeHandler}
          ref={valueRef}
        />
      </div>

      <div>
        <label>Probabilidad de ser elegida: </label>
        <input
          type="text"
          name="luck"
          value={formData.luck}
          onChange={changeHandler}
          ref={luckRef}
        />
      </div>

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

export default WordsForm;
