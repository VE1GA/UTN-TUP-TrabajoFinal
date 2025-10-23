const validarNombre = (nombre) => {
  if (!nombre.trim()) return "El nombre es obligatorio";
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre)) return "Solo se permiten letras";
  return null;
};

const validarEmail = (email) => {
  if (!email.trim()) return "El email es obligatorio";
  if (!/\S+@\S+\.\S+/.test(email)) return "El email no es válido";
  return null;
};

const validarPassword = (password, required = true) => {
  // Si es obligatoria y está vacía, retorna error
  if (required && !password.trim()) return "La contraseña es obligatoria";

  // Si NO es obligatoria y está vacía, es válido (retorna null)
  if (!required && !password.trim()) return null;

  // Si se proveyó una contraseña (obligatoria o no), debe cumplir el formato
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password))
    return "Mínimo 8 caracteres, incluyendo letras y números";

  return null;
};

const validarConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword.trim()) return "La confirmación de contraseña es obligatoria";
  if (password !== confirmPassword) return "Las contraseñas no coinciden";
  return null;
};

const validarValue = (value) => {
  if (!value.trim()) {
    return "La palabra es obligatoria";
  }
  if (!/^[a-zñ]{5}$/i.test(value)) {
    return "La palabra debe contener EXACTAMENTE 5 letras, sin números ni caracteres especiales";
  }
  return null;
};

const validarLuck = (luck) => {
  if (!luck.trim()) {
    return "Aclarar un valor es obligatorio";
  }
  if (!/^(100|[1-9]?\d)$/.test(luck)) {
    return "El valor no es válido, debe ser un número del 0 al 100";
  }
  return null;
};

export const Validations = async (datos, tipoValidacion) => {
  const errores = {};

  if (tipoValidacion === "register") {
    const errorNombre = validarNombre(datos.name);
    if (errorNombre) errores.name = errorNombre;

    const errorEmail = validarEmail(datos.email);
    if (errorEmail) {
      errores.email = errorEmail;
    } else {
      const response = await fetch("http://localhost:3000/check_repeat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: datos.email }),
      });

      const emailRepetido = await response.json();
      if (emailRepetido) errores.repetido = "Ya existe una cuenta registrada con ese correo";
    }

    const errorPassword = validarPassword(datos.password, true);
    if (errorPassword) errores.password = errorPassword;

    const errorConfirmPassword = validarConfirmPassword(datos.password, datos.confirmPassword);
    if (errorConfirmPassword) errores.confirmPassword = errorConfirmPassword;
  }

  if (tipoValidacion === "login") {
    const errorEmail = validarEmail(datos.email);
    if (errorEmail) errores.email = errorEmail;

    const errorPassword = validarPassword(datos.password, true);
    if (errorPassword) errores.password = errorPassword;
  }

  if (tipoValidacion === "edit") {
    const errorNombre = validarNombre(datos.name);
    if (errorNombre) errores.name = errorNombre;

    const errorEmail = validarEmail(datos.email);
    if (errorEmail) errores.email = errorEmail;

    const errorPassword = validarPassword(datos.password, false);
    if (errorPassword) errores.password = errorPassword;
  }

  if (tipoValidacion === "words") {
    const errorValue = validarValue(datos.value);
    if (errorValue) errores.value = errorValue;

    const errorLuck = validarLuck(datos.luck);
    if (errorLuck) errores.luck = errorLuck;
  }

  return errores;
};
