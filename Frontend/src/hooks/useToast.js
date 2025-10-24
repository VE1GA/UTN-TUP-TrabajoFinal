import { toast, Slide } from "react-toastify";
import { useCallback } from "react"; // <--- 1. Importamos useCallback

// 2. Movemos baseConfig afuera. Es una constante, no necesita estar en el hook.
const baseConfig = {
  position: "top-center",
  autoClose: 2500,
  theme: "dark",
  transition: Slide,
};

export const useToast = () => {
  // 3. Envolvemos cada función en useCallback
  const showSuccessToast = useCallback((message, options = {}) => {
    toast.success(message, { ...baseConfig, ...options });
  }, []); // <-- 4. Array de dependencias vacío

  const showErrorToast = useCallback((message, options = {}) => {
    toast.error(message, { ...baseConfig, ...options });
  }, []); // <-- 4. Array de dependencias vacío

  const showInfoToast = useCallback((message, options = {}) => {
    toast.info(message, { ...baseConfig, ...options });
  }, []); // <-- 4. Array de dependencias vacío

  return { showSuccessToast, showErrorToast, showInfoToast };
};
