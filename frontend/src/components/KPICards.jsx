import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    BuildingOfficeIcon,
    BriefcaseIcon,
    UserGroupIcon,
    CalendarDaysIcon,
    LinkIcon,
    CheckBadgeIcon,
    XCircleIcon,
    UserIcon,
    ClockIcon,
    UserMinusIcon,
    PhoneXMarkIcon
} from '@heroicons/react/24/outline';

const KPICards = ({ periodoFiltro, customInicio, customFin }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchKPIs = async () => {
            if (periodoFiltro === 'personalizado' && (!customInicio || !customFin)) return;

            try {
                setLoading(true);
                const query = new URLSearchParams({
                    periodo: periodoFiltro,
                    ...(periodoFiltro === 'personalizado' && { inicio: customInicio, fin: customFin })
                }).toString();

                const response = await api.get(`/kpis/resumen?` + query);
                setStats(response.data);
            } catch (error) {
                console.error('Error cargando KPIs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchKPIs();
    }, [periodoFiltro, customInicio, customFin]);

    const handleCardClick = (path) => {
        navigate(path, {
            state: {
                periodo: periodoFiltro,
                inicio: customInicio,
                fin: customFin
            }
        });
    };

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(idx => (
                    <div key={idx} className="bg-white p-6 rounded-lg shadow animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                    </div>
                ))}
            </div>
        );
    }

    if (!stats) return null;

    const cards = [
        { title: 'Empresas Atendidas', value: stats.empresas, color: 'text-blue-600', bg: 'bg-blue-100', icon: <BuildingOfficeIcon className="w-6 h-6" />, path: 'empresasatendidas' },
        { title: 'Ofertas Activas', value: stats.ofertas, color: 'text-indigo-600', bg: 'bg-indigo-100', icon: <BriefcaseIcon className="w-6 h-6" />, path: 'ofertas' },
        { title: 'Buscadores de Empleo', value: stats.buscadores, color: 'text-purple-600', bg: 'bg-purple-100', icon: <UserGroupIcon className="w-6 h-6" />, path: 'buscadores' },
        { title: 'Citas Programadas', value: stats.citas, color: 'text-yellow-600', bg: 'bg-yellow-100', icon: <CalendarDaysIcon className="w-6 h-6" />, path: 'citas' },
        { title: 'Vinculaciones', value: stats.vinculaciones, color: 'text-teal-600', bg: 'bg-teal-100', icon: <LinkIcon className="w-6 h-6" />, path: 'vinculaciones' },
        { title: 'Colocaciones', value: stats.colocaciones, color: 'text-green-600', bg: 'bg-green-100', icon: <CheckBadgeIcon className="w-6 h-6" />, path: 'colocaciones' },
        { title: 'Rechazos', value: stats.rechazos, color: 'text-red-600', bg: 'bg-red-100', icon: <XCircleIcon className="w-6 h-6" />, path: 'rechazos' },
        { title: 'Atenciones', value: stats.atenciones, color: 'text-cyan-600', bg: 'bg-cyan-100', icon: <UserIcon className="w-6 h-6" />, path: 'atenciones' },
        { title: 'En Espera', value: stats.enespera, color: 'text-orange-600', bg: 'bg-orange-100', icon: <ClockIcon className="w-6 h-6" />, path: 'enespera' },
        { title: 'No Se Presentó', value: stats.nosepresento, color: 'text-stone-600', bg: 'bg-stone-100', icon: <UserMinusIcon className="w-6 h-6" />, path: 'nosepresento' },
        { title: 'No Contestó', value: stats.nocontesto, color: 'text-pink-600', bg: 'bg-pink-100', icon: <PhoneXMarkIcon className="w-6 h-6" />, path: 'nocontesto' }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {cards.map((card, idx) => (
                <div
                    key={idx}
                    onClick={() => handleCardClick(card.path)}
                    className="bg-white p-6 rounded-lg shadow flex items-center gap-4 transition-transform hover:scale-105 cursor-pointer"
                >
                    <div className={`p-3 rounded-full ${card.bg} ${card.color}`}>
                        {card.icon}
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-medium">{card.title}</p>
                        <h3 className="text-2xl font-bold text-gray-800">
                            {card.value !== null ? card.value : '-'}
                        </h3>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KPICards;