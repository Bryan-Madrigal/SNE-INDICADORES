import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../services/api';

const ReportesGenerales = () => {
    const [tipoReporte, setTipoReporte] = useState('atenciones');
    const [tipoVacante, setTipoVacante] = useState('mas-postuladas');
    const [inicio, setInicio] = useState('');
    const [fin, setFin] = useState('');
    const [datos, setDatos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [unidades, setUnidades] = useState([]);
    const [cveUnOperativa, setCveUnOperativa] = useState('0');

    React.useEffect(() => {
        const fetchUnidades = async () => {
            try {
                const res = await api.get('/reportes/unidades');
                setUnidades(res.data);
            } catch (err) {
                console.error('Error al cargar unidades', err);
            }
        };
        fetchUnidades();
    }, []);

    const reportesOpciones = [
        { value: 'atenciones', label: 'Reporte de Atenciones' },
        { value: 'postulaciones', label: 'Reporte de Postulaciones' },
        { value: 'colocaciones', label: 'Reporte de Colocaciones' },
        { value: 'vacantes', label: 'Reporte de Ofertas de Empleo (Vacantes)' }
    ];

    const vacantesOpciones = [
        { value: 'mas-postuladas', label: 'Con más postulaciones' },
        { value: 'sin-postulacion', label: 'Con ninguna postulación' },
        { value: 'proximas-vencer', label: 'Próximas a vencer (próx 7 días)' },
        { value: 'vencidas-sin-postulacion', label: 'Vencidas sin postulaciones' },
        { value: 'vigentes', label: 'Vacantes Vigentes' }
    ];

    const generarReporte = async () => {
        setLoading(true);
        setError(null);
        setDatos([]);
        try {
            let endpoint = `/reportes/${tipoReporte}?`;
            const params = new URLSearchParams();
            if (inicio) params.append('inicio', inicio);
            if (fin) params.append('fin', fin);
            if (tipoReporte === 'vacantes') {
                params.append('tipo', tipoVacante);
            } else {
                params.append('oficina', cveUnOperativa);
            }

            const res = await api.get(endpoint + params.toString());
            setDatos(res.data);
            if (res.data.length === 0) {
                setError('No se encontraron registros para los filtros seleccionados.');
            }
        } catch (err) {
            console.error(err);
            setError('Ocurrió un error al generar el reporte. Revise la consola.');
        } finally {
            setLoading(false);
        }
    };

    const exportarExcel = () => {
        if (datos.length === 0) return;
        const worksheet = XLSX.utils.json_to_sheet(datos);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
        
        const fecha = new Date().toISOString().split('T')[0];
        let filename = `Reporte_${tipoReporte}`;
        if (tipoReporte === 'vacantes') filename += `_${tipoVacante}`;
        filename += `_${fecha}.xlsx`;

        XLSX.writeFile(workbook, filename);
    };

    return (
        <div className="space-y-6 pb-12">
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Generador de Reportes Generales</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Reporte</label>
                        <select 
                            value={tipoReporte}
                            onChange={(e) => setTipoReporte(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {reportesOpciones.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    
                    {tipoReporte === 'vacantes' ? (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Filtro de Vacante</label>
                            <select 
                                value={tipoVacante}
                                onChange={(e) => setTipoVacante(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                {vacantesOpciones.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Unidad Operativa</label>
                            <select 
                                value={cveUnOperativa}
                                onChange={(e) => setCveUnOperativa(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                                <option value="0">Todas las Unidades (Global)</option>
                                {unidades.map(u => (
                                    <option key={u.CveUnOperativa} value={u.CveUnOperativa}>{u.Nombre}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio (Opcional)</label>
                        <input 
                            type="date"
                            value={inicio}
                            onChange={(e) => setInicio(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin (Opcional)</label>
                        <input 
                            type="date"
                            value={fin}
                            onChange={(e) => setFin(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <button 
                        onClick={generarReporte}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-md shadow transition disabled:opacity-50"
                    >
                        {loading ? 'Generando...' : 'Generar Reporte'}
                    </button>
                    <button 
                        onClick={exportarExcel}
                        disabled={datos.length === 0}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-md shadow transition disabled:opacity-50"
                    >
                        Exportar a Excel
                    </button>
                </div>
                
                {error && <p className="text-red-500 mt-4 text-sm font-medium">{error}</p>}
            </div>

            {datos.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow overflow-hidden">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Resultados ({datos.length} registros)</h3>
                    </div>
                    <div className="overflow-x-auto max-h-[500px] border border-gray-200 rounded-md">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="uppercase tracking-wider border-b-2 bg-gray-50 sticky top-0">
                                <tr>
                                    {Object.keys(datos[0]).map((key) => (
                                        <th key={key} className="px-6 py-3 border-r border-gray-200 text-gray-700 font-bold min-w-40">
                                            {key}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {datos.map((row, i) => (
                                    <tr key={i} className="border-b odd:bg-white even:bg-gray-50 hover:bg-blue-50">
                                        {Object.values(row).map((val, j) => (
                                            <td key={j} className="px-6 py-3 border-r border-gray-200 text-gray-600">
                                                {val === null || val === undefined ? 'N/A' : (
                                                    typeof val === 'string' && (val.includes('T00:00:00') || val.match(/^\d{4}-\d{2}-\d{2}T/))
                                                    ? val.split('T')[0]
                                                    : String(val)
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReportesGenerales;
