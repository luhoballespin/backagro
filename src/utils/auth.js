// Guardar token en localStorage
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

// Obtener token
export const getToken = () => {
  return localStorage.getItem('token');
};

// Eliminar token
export const removeToken = () => {
  localStorage.removeItem('token');
};

// Verificar si el usuario está autenticado
export const isAuthenticated = () => {
  return !!getToken();
}; 