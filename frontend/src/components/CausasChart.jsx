import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { 
    ResponsiveContainer, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend,
    Cell
} from 'recharts';

const CausasChart = ({ periodoFiltro = 'mensual', customInicio, customFin }) => {
    const [dataCausas, setDataCausas] = useState([]);
    const [loading, setLoading] = useState(true);

    const COLORS = ['#F87171', '#FBBF24', '#34D399', '#60A5FA', '#A78BFA', '#A78BFA', '#A78BFA'];

    useEffect(() => {
        const fetchCausas = async () => {
            if (periodoFiltro === 'personalizado' && (!customInicio || !customFin)) return;

            setLoading(true);
            try {
                const query = new URLSearchParams({
                    periodo: periodoFiltro,
                    ...(periodoFiltro === 'personalizado' && { inicio: customInicio, fin: customFin })
                }).toString();

                const response = await api.get(`/rechazos/causas?` + query);
                setDataCausas(response.data);
            } catch (error) {
                console.error("Error al cargar causas", error);
            } finally {
                setLoading(false);
            }
        };

        fetchCausas();
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
            <h3 className="text-lg font-bold text-gray-800 mb-4">Causas de Rechazo</h3>
            <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={dataCausas}
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 100, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="causa" type="category" tick={{fontSize: 12, fill: '#6B7280'}} width={100} />
                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                            {dataCausas.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CausasChart;
