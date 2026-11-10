import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Outlet, NavLink } from 'react-router-dom';
import axios from 'axios';

const NAV_ITEMS = [
    {
        to: '/dashboard',
        end: true,
        label: 'Inicio',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
            </svg>
        ),
    },

    {
        to: '/dashboard/avances',
        end: false,
        label: 'Avances',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
            </svg>
        ),
    },

    {
        to: '/dashboard/metas',
        end: false,
        label: 'Asignación Tipo Metas',
        adminOnly: true,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
            </svg>
        ),
    },

    {
        to: '/dashboard/tipo-meta-participacion',
        end: false,
        label: 'Participación TipoMeta',
        adminOnly: true,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3 1.343 3 3-1.343 3-3 3m0-15c1.105 0 2 .895 2 2m-2-2V4m0 2c-1.105 0-2 .895-2 2m2 11v2m0-2c1.105 0-2 1.343-2 2m2 2c-1.105 0-2-.895-2-2"
                />
            </svg>
        ),
    },

    {
        to: '/dashboard/oficina-buscadores-participacion',
        end: false,
        label: 'Participación Oficina',
        adminOnly: true,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5.581m0 0H9m5.581 0L9 7.581M9 21H7a2 2 0 01-2-2v-1m0 0H4m2 0h5.581"
                />
            </svg>
        ),
    },

    {
        to: '/dashboard/asignacion-global',
        end: false,
        label: 'Asignación Global',
        adminOnly: true,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z"
                />
            </svg>
        ),
    },

    {
        to: '/dashboard/reportes-generales',
        end: false,
        label: 'Reportes Generales',
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
            </svg>
        ),
    },

    {
        to: '/dashboard/configuracion',
        end: false,
        label: 'Configuración',
        adminOnly: true,
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c1.543.94 3.31-.826 2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94 1.543.826 3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
            </svg>
        ),
    },
];

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [config, setConfig] = useState(null);

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const apiUrl = import.meta.env.PROD
                    ? (import.meta.env.VITE_API_URL || '/indicadores/api')
                    : 'http://localhost:5000/api';

                const res = await axios.get(`${apiUrl}/config`);

                setConfig(res.data);
            } catch (error) {
                console.error(
                    'Error al cargar configuración en Navbar',
                    error
                );
            }
        };

        fetchConfig();
    }, []);

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            <header className="fixed top-0 left-0 right-0 h-[65px] bg-[#9D2449] text-white shadow-md z-50">
                {/* Línea dorada */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-[#B38E5D]"></div>
                <div className="h-full px-4 sm:px-6 lg:px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() =>
                                setSidebarOpen(!sidebarOpen)
                            }
                            className="p-1 rounded hover:bg-[#7a1c38] focus:outline-none transition-colors"
                            aria-label="Toggle sidebar"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            </svg>
                        </button>
                        {config?.logo1 && (
                            <img
                                src={config.logo1}
                                alt="Logo"
                                className="h-8 w-auto hidden sm:block object-contain"
                            />
                        )}
                        <div className="flex flex-col ml-2">
                            <h1 className="text-sm font-bold tracking-wide uppercase">
                                {config?.appName || 'Tablero SNE'}
                            </h1>
                            <span className="text-xs text-[#B38E5D] font-medium">
                                {config?.dependencyName || ''}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-light hidden sm:block">
                            {user?.nombre || user?.usuario}
                            <span className="text-[#B38E5D]">
                                {' '}
                                ({user?.rol || 'Rol'})
                            </span>
                        </span>
                        <button
                            onClick={logout}
                            className="text-xs bg-white text-[#9D2449] border border-white font-bold px-4 py-1.5 rounded-full hover:bg-gray-100 hover:text-[#7a1c38] transition shadow-sm"
                        >
                            Cerrar Sesión
                        </button>

                    </div>

                </div>

            </header>

            <div className="flex flex-1 pt-[65px] overflow-hidden">
                {sidebarOpen && (
                    <div
                        className="md:hidden fixed inset-0 bg-black/50 z-40"
                        onClick={() => setSidebarOpen(false)}
                    ></div>
                )}
                <aside
                    className={`
                        fixed
                        top-[65px]
                        bottom-0
                        left-0
                        z-40
                        bg-white
                        border-r
                        border-[#B38E5D]/30
                        flex
                        flex-col
                        shadow-lg
                        md:shadow-sm
                        transition-all
                        duration-300
                        overflow-hidden
                        ${
                            sidebarOpen
                                ? 'w-64 translate-x-0'
                                : 'w-64 -translate-x-full md:w-0 md:-translate-x-0'
                        }
                    `}
                >
                    <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">

                        {NAV_ITEMS
                            .filter(
                                item =>
                                    !item.adminOnly ||
                                    user?.rol === 'admin'
                            )
                            .map(item => (

                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    onClick={() => {
                                        if (window.innerWidth < 768) {
                                            setSidebarOpen(false);
                                        }
                                    }}
                                    className={({ isActive }) =>
                                        `
                                        flex
                                        items-center
                                        gap-3
                                        px-3
                                        py-2.5
                                        rounded-lg
                                        text-sm
                                        font-semibold
                                        transition-all

                                        ${
                                            isActive
                                                ? 'bg-[#9D2449]/10 text-[#9D2449] border-r-4 border-[#B38E5D]'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-[#9D2449]'
                                        }
                                        `
                                    }
                                >
                                    {item.icon}
                                    <span className="whitespace-nowrap">
                                        {item.label}
                                    </span>
                                </NavLink>
                            ))}
                    </nav>
                    <div className="px-4 py-4 border-t border-gray-100 text-xs text-center text-gray-400">
                        {config?.dependencyName ||
                            'Gobierno del Estado'}
                        <br />
                        &copy; {new Date().getFullYear()}
                    </div>
                </aside>
                <main
                    className={`
                        flex-1
                        h-full
                        overflow-y-auto
                        transition-all
                        duration-300

                        ${
                            sidebarOpen
                                ? 'md:ml-64'
                                : 'md:ml-0'
                        }
                    `}
                >
                    <div className="px-4 sm:px-6 lg:px-8 py-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Dashboard;