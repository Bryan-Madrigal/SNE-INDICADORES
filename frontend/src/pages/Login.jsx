import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
    const { user, login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [credentials, setCredentials] = useState({ usuario: '', password: '' });
    const [errorMsg, setErrorMsg] = useState('');
    const [config, setConfig] = useState(null);
    const [loadingConfig, setLoadingConfig] = useState(true);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const apiUrl = import.meta.env.PROD ? (import.meta.env.VITE_API_URL || '/indicadores/api') : 'http://localhost:5000/api';
                const res = await axios.get(`${apiUrl}/config`);
                setConfig(res.data);
            } catch (error) {
                console.error('Error al cargar configuración', error);
            } finally {
                setLoadingConfig(false);
            }
        };
        fetchConfig();
    }, []);

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        const { usuario, password } = credentials;
        const res = await login(usuario, password);
        if (res.success) {
            navigate('/dashboard');
        } else {
            setErrorMsg(res.message);
        }
    };

    if (loadingConfig) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#9D2449]"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4 sm:p-8">
            <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden">
                
                {/* Panel Izquierdo Institucional Flotante */}
                <div className="relative w-full md:w-5/12 bg-[#9D2449] p-8 sm:p-12 flex flex-col items-center justify-center text-white overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#9D2449] to-[#6b1831]"></div>
                    <div className="absolute top-0 left-0 w-full h-2 bg-[#B38E5D]"></div>
                    
                    {/* Efectos luminosos de fondo */}
                    <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                    <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>

                    <div className="relative z-10 w-full flex flex-col items-center">
                        {/* Contenedor de Logos estilo Glassmorphism */}
                        <div className="flex flex-col items-center justify-center gap-6 mb-10 w-full bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg">
                            {config?.logo1 ? (
                                <img src={config.logo1} alt="Logo Principal" className="max-h-20 w-auto max-w-[90%] object-contain drop-shadow-lg transition-transform hover:scale-105 duration-300" />
                            ) : (
                                <div className="h-20 w-20 bg-white/20 rounded-full flex items-center justify-center text-xs text-center drop-shadow-md">Sin Logo princ.</div>
                            )}
                            
                            {config?.logo1 && config?.logo2 && (
                                <div className="h-px w-2/3 bg-white/30 rounded-full"></div>
                            )}

                            {config?.logo2 && (
                                <img src={config.logo2} alt="Logo Secundario" className="max-h-24 w-auto max-w-[90%] object-contain drop-shadow-lg transition-transform hover:scale-105 duration-300" />
                            )}
                        </div>
                        
                        {/* Textos Institucionales */}
                        <div className="text-center w-full">
                            <h1 className="text-2xl sm:text-3xl font-extrabold mb-4 leading-tight tracking-tight drop-shadow-md uppercase">
                                {config?.appName || 'Nombre de la Aplicación'}
                            </h1>
                            <div className="w-12 h-1 bg-[#B38E5D] mx-auto mb-5 rounded-full opacity-90"></div>
                            <h2 className="text-sm font-medium opacity-90 leading-snug drop-shadow-sm uppercase tracking-widest">
                                {config?.dependencyName || 'Dependencia Institucional'}
                            </h2>
                        </div>
                    </div>
                </div>

                {/* Panel Derecho de Formulario Flotante */}
                <div className="w-full md:w-7/12 p-8 sm:p-14 flex flex-col justify-center bg-white relative">
                    <div className="text-center mb-8 md:hidden">
                        {config?.logo1 && (
                            <img src={config.logo1} alt="Logo Movil" className="mx-auto mb-4 max-h-20 object-contain" />
                        )}
                        <h2 className="text-xl font-bold text-[#9D2449]">{config?.appName || 'Aplicación'}</h2>
                    </div>
                    
                    <div className="mb-10 text-center md:text-left">
                        <h2 className="text-3xl font-extrabold text-gray-800 mb-2">Iniciar Sesión</h2>
                        <p className="text-gray-500 font-medium">Introduce tus credenciales para acceder al sistema.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6 w-full max-w-md mx-auto md:mx-0">
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">Usuario</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-[#9D2449] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                </div>
                                <input type="text" name="usuario" value={credentials.usuario} onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9D2449]/50 focus:border-[#9D2449] focus:bg-white transition-all font-medium" required placeholder="Ej: admin" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-gray-700 text-sm font-bold mb-2 ml-1">Contraseña</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <svg className="h-5 w-5 text-gray-400 group-focus-within:text-[#9D2449] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                </div>
                                <input type="password" name="password" value={credentials.password} onChange={handleChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#9D2449]/50 focus:border-[#9D2449] focus:bg-white transition-all font-medium" required placeholder="••••••••" />
                            </div>
                        </div>

                        {errorMsg && (
                            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg text-red-700 text-sm flex items-center shadow-sm">
                                <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                <span>{errorMsg}</span>
                            </div>
                        )}

                        <div className="pt-4">
                            <button type="submit" className="w-full flex justify-center items-center bg-[#9D2449] hover:bg-[#7a1c38] text-white font-bold py-3.5 px-4 rounded-xl shadow-md transform hover:-translate-y-1 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-[#9D2449]/30 group">
                                <span className="mr-2">Entrar al Sistema</span>
                                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </button>
                        </div>
                        
                        <div className="text-center mt-10 md:mt-12">
                            <span className="text-xs text-gray-400 font-medium tracking-wide">
                                © {new Date().getFullYear()} Gobierno del Estado de Chiapas
                            </span>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;