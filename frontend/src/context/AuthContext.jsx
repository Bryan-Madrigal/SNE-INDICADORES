import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verifySession = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const response = await api.get('/auth/me');
                    setUser(response.data);
                } catch (error) {
                    console.error('Error verificando sesión');
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        verifySession();
    }, []);

    const login = async (usuario, password) => {
        try {
            const response = await api.post('/auth/login', { usuario, password });
            localStorage.setItem('token', response.data.token);
            setUser(response.data.usuario); // O payload desencriptado del backend
            return { success: true };
        } catch (error) {
            console.error('Error en el login', error);
            return { success: false, message: error.response?.data?.message || 'Error de conexión' };
        }
    };

    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error(error);
        } finally {
            localStorage.removeItem('token');
            setUser(null);
            const basename = import.meta.env.BASE_URL || '/';
            window.location.href = `${basename}login`;
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};