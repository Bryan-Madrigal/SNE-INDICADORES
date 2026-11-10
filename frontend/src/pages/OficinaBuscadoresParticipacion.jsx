import React, { useEffect, useState } from 'react';
import api from '../services/api';

const OficinaBuscadoresParticipacion = () => {
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [rows, setRows] = useState([]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/oficina-buscadores-participacion', {
                params: { anio },
            });
            const data = Array.isArray(res.data) ? res.data : [];
            setRows(data);
        } catch (error) {
            console.error('Error al cargar participación de oficinas', error);
            alert(error.response?.data?.message || 'No fue posible cargar la participación de oficinas.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [anio]);

    const updateRow = (index, value) => {
        setRows((previous) =>
            previous.map((row, i) =>
                i === index ? { ...row, PorcentajeParticipacion: value } : row
            )
        );
    };

    const totalParticipacion = rows.reduce(
        (sum, row) => sum + (Number(row.PorcentajeParticipacion) || 0),
        0
    );

    const handleSave = async () => {
        if (rows.length === 0) {
            alert('No hay oficinas para guardar.');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                participaciones: rows.map((row) => ({
                    OficinaBuscadoresId: row.OficinaBuscadoresId,
                    PorcentajeParticipacion: Number(row.PorcentajeParticipacion) || 0,
                })),
                anio,
            };

            const res = await api.post('/oficina-buscadores-participacion', payload);
            alert(res.data?.message || 'Participación guardada correctamente.');
            loadData();
        } catch (error) {
            console.error('Error al guardar participación de oficinas', error);
            alert(error.response?.data?.message || 'No fue posible guardar la participación.');
        } finally {
            setSaving(false);
        }
    };

    const totalOk = Math.abs(totalParticipacion - 100) <= 0.01;

    return (
        <div className="space-y-4 pb-12">
            <div className="bg-white rounded-lg shadow px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Participación por Oficina</h2>
                    <p className="text-sm text-gray-500">
                        Define el porcentaje de participación de cada oficina para el año seleccionado.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        min="2020"
                        max="2099"
                        value={anio}
                        onChange={(e) => setAnio(Number(e.target.value))}
                        className="px-3 py-2 border rounded-md text-sm bg-white border-gray-200"
                    />
                    <button
                        onClick={loadData}
                        disabled={loading}
                        className="px-4 py-2 rounded-md text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                    >
                        {loading ? 'Cargando...' : 'Recargar'}
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="px-5 py-2 rounded-md text-sm font-bold bg-[#9D2449] text-white hover:bg-[#7a1c38] disabled:opacity-50"
                    >
                        {saving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-700">Catálogo de Oficinas - Año {anio}</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 min-w-[300px]">Oficina</th>
                                <th className="px-4 py-3 w-40 text-right">Participación %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="2" className="px-4 py-8 text-center text-gray-500 bg-gray-50">
                                        No hay oficinas disponibles.
                                    </td>
                                </tr>
                            )}

                            {rows.map((row, index) => (
                                <tr key={row.OficinaBuscadoresId} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium text-gray-700">{row.Nombre}</td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={row.PorcentajeParticipacion || ''}
                                            onChange={(e) => updateRow(index, e.target.value)}
                                            className="w-full border rounded px-3 py-1.5 text-sm text-right border-gray-200 bg-white"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        {rows.length > 0 && (
                            <tfoot>
                                <tr className="bg-gray-50 font-bold text-gray-800">
                                    <td className="px-4 py-3">TOTAL</td>
                                    <td
                                        className={`px-4 py-3 text-right rounded-tl-sm ${
                                            totalOk ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                        }`}
                                    >
                                        {totalParticipacion.toFixed(2)}%
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>

            {!totalOk && rows.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-4 py-3 text-sm font-medium">
                    Advertencia: La suma de participación debe ser 100%. Actualmente suma {totalParticipacion.toFixed(2)}%.
                </div>
            )}
        </div>
    );
};

export default OficinaBuscadoresParticipacion;
