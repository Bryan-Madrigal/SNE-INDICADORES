import React, { useEffect, useState } from 'react';
import api from '../services/api';
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    Legend
} from 'recharts';

const DemograficoLaboralChart = ({ periodoFiltro = 'mensual', customInicio, customFin }) => {
    const [datosEdades, setDatosEdades] = useState([]);
    const [datosEscolaridad, setDatosEscolaridad] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDemograficos = async () => {
             if (periodoFiltro === 'personalizado' && (!customInicio || !customFin)) return;

             setLoading(true);
             try {
                const query = new URLSearchParams({
                    periodo: periodoFiltro,
                    ...(periodoFiltro === 'personalizado' && { inicio: customInicio, fin: customFin })
                }).toString();

                const [resEdades, resEscolaridad] = await Promise.all([
                    api.get(`/estadisticas/por-edad?${query}`),
                    api.get(`/estadisticas/por-escolaridad?${query}`)
                ]);
                setDatosEdades(resEdades.data);
                setDatosEscolaridad(resEscolaridad.data);
             } catch (error) {
                 console.error("Error al obtener datos demográficos", error);
             } finally {
                 setLoading(false);
             }
        };

        fetchDemograficos();
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
            {/* Gráfica de Edades (Bar) */}
            <div className="bg-white rounded-lg shadow p-6 w-full">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Avances por Rango de Edad</h3>
                <div className="h-64 flex justify-center items-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={datosEdades}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="rango_edad" tick={{fontSize: 12, fill: '#6B7280'}} tickMargin={10} />
                            <YAxis tick={{fontSize: 12, fill: '#6B7280'}} />
                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend verticalAlign="top" height={36}/>
                            <Bar dataKey="atenciones" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Atenciones" />
                            <Bar dataKey="vinculaciones" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Postulaciones" />
                            <Bar dataKey="colocaciones" fill="#10B981" radius={[4, 4, 0, 0]} name="Colocaciones" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Gráfica de Escolaridad (Bar) */}
            <div className="bg-white rounded-lg shadow p-6 w-full">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Avances por Nivel Educativo</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={datosEscolaridad}
                            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="nivel" tick={{fontSize: 12, fill: '#6B7280'}} tickMargin={10} />
                            <YAxis tick={{fontSize: 12, fill: '#6B7280'}} />
                            <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                            <Legend verticalAlign="top" height={36}/>
                            <Bar dataKey="atenciones" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Atenciones" />
                            <Bar dataKey="vinculaciones" fill="#F59E0B" radius={[4, 4, 0, 0]} name="Postulaciones" />
                            <Bar dataKey="colocaciones" fill="#10B981" radius={[4, 4, 0, 0]} name="Colocaciones" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default DemograficoLaboralChart;
