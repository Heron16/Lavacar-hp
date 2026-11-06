import axios from 'axios';

// Em produção (via Nginx): VITE_API_URL não é definido, usa '/api' (proxy reverso)
// Em desenvolvimento local (sem Nginx): usa a variável de ambiente
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isLoginRoute = error.config?.url?.includes('/auth/login');
    if (error.response?.status === 401 && !isLoginRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
