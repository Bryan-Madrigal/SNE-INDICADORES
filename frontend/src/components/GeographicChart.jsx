import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as BarTooltip,
    Legend,
    Cell
} from 'recharts';

const GeographicChart = ({ periodoFiltro = 'mensual', customInicio, customFin }) => {
    const [datosOficina, setDatosOficina] = useState([]);
    const [datosMunicipio, setDatosMunicipio] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGeografico = async () => {
            if (periodoFiltro === 'personalizado' && (!customInicio || !customFin)) return;

            setLoading(true);
            try {
                const query = new URLSearchParams({
                    periodo: periodoFiltro,
                    ...(periodoFiltro === 'personalizado' && { inicio: customInicio, fin: customFin })
                }).toString();

                const [resOficina, resMunicipio] = await Promise.all([
                    api.get(`/estadisticas/por-oficina?${query}`),
                    api.get(`/estadisticas/por-municipio?${query}`)
                ]);
                setDatosOficina(resOficina.data);
                setDatosMunicipio(resMunicipio.data);
            } catch (error) {
                console.error("Error al obtener datos geográficos", error);
            } finally {
                setLoading(false);
            }
        };

        fetchGeografico();
    }, [periodoFiltro, customInicio, customFin]);

    if (loading) {
        return (
            <div className="flex flex-col md:flex-row gap-6 mt-8">
                <div className="bg-white rounded-lg shadow p-6 h-80 w-full animate-pulse"></div>
                <div className="bg-white rounded-lg shadow p-6 h-80 w-full animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {/* Gráfica por Oficina */}
            <div className="bg-white rounded-lg shadow p-6 w-full">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Avances por Oficina</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={datosOficina}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="oficina" tick={{fontSize: 12, fill: '#6B7280'}} tickMargin={10} />
                            <YAxis tick={{fontSize: 12, fill: '#6B7280'}} />
                            <BarTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend verticalAlign="top" height={36}/>
                            <Bar dataKey="atenciones" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Atenciones" />
                            <Bar dataKey="vinculaciones" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Postulaciones" />
                            <Bar dataKey="colocaciones" fill="#10B981" radius={[4, 4, 0, 0]} name="Colocaciones" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Gráfica Top Municipios */}
            <div className="bg-white rounded-lg shadow p-6 w-full">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Municipios (Postulaciones vs Colocaciones)</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={datosMunicipio}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="municipio" tick={{fontSize: 12, fill: '#6B7280'}} tickMargin={10} />
                            <YAxis tick={{fontSize: 12, fill: '#6B7280'}} />
                            <BarTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend verticalAlign="top" height={36}/>
                            <Bar dataKey="vinculaciones" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Postulaciones" />
                            <Bar dataKey="colocaciones" fill="#10B981" radius={[4, 4, 0, 0]} name="Colocaciones" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default GeographicChart;
