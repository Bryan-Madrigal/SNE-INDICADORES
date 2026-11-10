import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
    ResponsiveContainer, 
    ComposedChart, 
    Line, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend 
} from 'recharts';

const PeriodChart = ({ periodoFiltro = 'mensual', customInicio, customFin }) => {
    const [dataChart, setDataChart] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchIndicadores = async () => {
            if (periodoFiltro === 'personalizado' && (!customInicio || !customFin)) return;

            setLoading(true);
            try {
                const query = new URLSearchParams({
                    periodo: periodoFiltro,
                    ...(periodoFiltro === 'personalizado' && { inicio: customInicio, fin: customFin })
                }).toString();

                const res = await api.get(`/periodo?` + query);

                const finalData = res.data.map(item => ({
                    periodo: item.periodo,
                    Ofertas: item.ofertas_activas,
                    Vinculaciones: item.vinculaciones_realizadas,
                    Colocaciones: item.colocaciones_realizadas
                }));

                setDataChart(finalData);

            } catch (error) {
                console.error("Error al obtener datos por periodo", error);
            } finally {
                setLoading(false);
            }
        };

        fetchIndicadores();
    }, [periodoFiltro, customInicio, customFin]);

    if (loading) {
        return (
            <div className="flex flex-col bg-white rounded-lg shadow p-6 h-96 w-full animate-pulse">
                <div className="h-6 w-1/3 bg-gray-300 rounded mb-4"></div>
                <div className="flex-1 bg-gray-100 rounded"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow p-6 w-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Indicadores por Periodo</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={dataChart}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="periodo" tick={{fontSize: 12, fill: '#6B7280'}} tickMargin={10} />
                        <YAxis tick={{fontSize: 12, fill: '#6B7280'}} />
                        <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />

                        <Bar dataKey="Ofertas" barSize={30} fill="#6366F1" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="Vinculaciones" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        <Line type="monotone" dataKey="Colocaciones" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default PeriodChart;
