import React, { useState } from 'react';
import KPICards from '../components/KPICards';
import PeriodChart from '../components/PeriodChart';
import CausasChart from '../components/CausasChart';
import GeographicChart from '../components/GeographicChart';
import DemograficoLaboralChart from '../components/DemograficoLaboralChart';

const DashboardHome = () => {
    const [periodo, setPeriodo] = useState('mensual');
    const [customInicio, setCustomInicio] = useState('');
    const [customFin, setCustomFin] = useState('');

    return (
        <div className="space-y-6 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-lg shadow gap-4">
                <h2 className="text-xl font-bold text-gray-800">Resumen General</h2>
                
                <div className="flex items-center gap-4">
                    {periodo === 'personalizado' && (
                        <div className="flex items-center gap-2">
                            <input 
                                type="date" 
                                value={customInicio}
                                onChange={(e) => setCustomInicio(e.target.value)}
                                className="border border-gray-300 rounded-md text-sm px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                            <span className="text-gray-500">a</span>
                            <input 
                                type="date" 
                                value={customFin}
                                onChange={(e) => setCustomFin(e.target.value)}
                                className="border border-gray-300 rounded-md text-sm px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                        </div>
                    )}

                    {/* Selector de Periodo */}
                    <select
                        value={periodo}
                        onChange={(e) => setPeriodo(e.target.value)}
                        className="border border-gray-300 rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500"
                    >
                        <option value="todos">Todos los tiempos</option>
                        <option value="diario">Hoy</option>
                        <option value="semanal">Últimos 7 días</option>
                        <option value="mensual">Este Mes</option>
                        <option value="anual">Este Año</option>
                        <option value="personalizado">Personalizado</option>
                    </select>
                </div>
            </div>

            <KPICards periodoFiltro={periodo} customInicio={customInicio} customFin={customFin} />

            <div className="grid grid-cols-1 gap-6 mt-8">
               <PeriodChart periodoFiltro={periodo} customInicio={customInicio} customFin={customFin} />
               <CausasChart periodoFiltro={periodo} customInicio={customInicio} customFin={customFin} />
            </div>

            <GeographicChart periodoFiltro={periodo} customInicio={customInicio} customFin={customFin} />
            <DemograficoLaboralChart periodoFiltro={periodo} customInicio={customInicio} customFin={customFin} />
        </div>
    );
};

export default DashboardHome;
