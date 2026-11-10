    import axios from 'axios';

    // Si corre en producción, usará la misma ruta pública (puerto 80/443) y el subdirectorio.
    // IIS se encargará de interceptar /indicadores/api y redirigirlo internamente al puerto 5000.
    const api = axios.create({
        baseURL: import.meta.env.PROD 
            ? '/indicadores/api'
            : 'http://localhost:5000/api',
    });

    // Interceptor para agregar JWT al header si existe
    api.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    }, (error) => {
        return Promise.reject(error);
    });

    // Interceptor para atrapar 401 si expira token
    api.interceptors.response.use((response) => {
        return response;
    }, (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('token');
            const basename = import.meta.env.BASE_URL || '/';
            window.location.href = `${basename}login`;
        }
        return Promise.reject(error);
    });

    export default api;