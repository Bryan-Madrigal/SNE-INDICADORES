import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const EMPTY_ROW = {
    PctAtendidos: '',
    PctVinculados: '',
    PctColocados: '',
    PctPlazasVacantes: '',
};

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const TipoMetaParticipacion = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [rows, setRows] = useState([]);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await api.get('/tipo-meta-participacion');
            const data = Array.isArray(res.data) ? res.data : [];
            setRows(data.length > 0 ? data : []);
        } catch (error) {
            console.error('Error al cargar participación de TipoMeta', error);
            alert(error.response?.data?.message || 'No fue posible cargar la participación de TipoMeta.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const updateRow = (index, field, value) => {
        setRows((previous) => previous.map((row, rowIndex) => (
            rowIndex === index ? { ...row, [field]: value } : row
        )));
    };

    const columnTotals = useMemo(() => ({
        PctAtendidos: round2(rows.reduce((sum, row) => sum + (Number(row.PctAtendidos) || 0), 0)),
        PctVinculados: round2(rows.reduce((sum, row) => sum + (Number(row.PctVinculados) || 0), 0)),
        PctColocados: round2(rows.reduce((sum, row) => sum + (Number(row.PctColocados) || 0), 0)),
        PctPlazasVacantes: round2(rows.reduce((sum, row) => sum + (Number(row.PctPlazasVacantes) || 0), 0)),
    }), [rows]);

    const handleSave = async () => {
        if (rows.length === 0) {
            alert('No hay tipos de meta para guardar.');
            return;
        }

        try {
            setSaving(true);
            const payload = {
                items: rows.map((row) => ({
                    TipoMetaId: row.TipoMetaId,
                    PctAtendidos: Number(row.PctAtendidos) || 0,
                    PctVinculados: Number(row.PctVinculados) || 0,
                    PctColocados: Number(row.PctColocados) || 0,
                    PctPlazasVacantes: Number(row.PctPlazasVacantes) || 0,
                })),
            };

            const res = await api.post('/tipo-meta-participacion', payload);
            alert(res.data?.message || 'Participación guardada correctamente.');
            loadData();
        } catch (error) {
            console.error('Error al guardar participación de TipoMeta', error);
            alert(error.response?.data?.message || 'No fue posible guardar la participación de TipoMeta.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4 pb-12">
            <div className="bg-white rounded-lg shadow px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Participación global por TipoMeta</h2>
                    <p className="text-sm text-gray-500">Captura una sola vez la distribución porcentual que se usará para todos los meses.</p>
                </div>
                <div className="flex gap-3">
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
                        {saving ? 'Guardando...' : 'Guardar participación'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-semibold text-gray-700">Catálogo de TipoMeta</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 min-w-[240px]">TipoMeta</th>
                                <th className="px-4 py-3 w-32 text-right">Atendidos %</th>
                                <th className="px-4 py-3 w-32 text-right">Vinculados %</th>
                                <th className="px-4 py-3 w-32 text-right">Colocados %</th>
                                <th className="px-4 py-3 w-32 text-right">Vacantes %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500 bg-gray-50">
                                        No hay tipos de meta disponibles.
                                    </td>
                                </tr>
                            )}

                            {rows.map((row, index) => (
                                <tr key={row.TipoMetaId} className="hover:bg-gray-50">
                                    <td className="px-4 py-2 font-medium text-gray-700">
                                        {row.Nombre}
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={row.PctAtendidos ?? EMPTY_ROW.PctAtendidos}
                                            onChange={(e) => updateRow(index, 'PctAtendidos', e.target.value)}
                                            className="w-full border rounded px-3 py-1.5 text-sm text-right border-gray-200 bg-white"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={row.PctVinculados ?? EMPTY_ROW.PctVinculados}
                                            onChange={(e) => updateRow(index, 'PctVinculados', e.target.value)}
                                            className="w-full border rounded px-3 py-1.5 text-sm text-right border-gray-200 bg-white"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={row.PctColocados ?? EMPTY_ROW.PctColocados}
                                            onChange={(e) => updateRow(index, 'PctColocados', e.target.value)}
                                            className="w-full border rounded px-3 py-1.5 text-sm text-right border-gray-200 bg-white"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={row.PctPlazasVacantes ?? EMPTY_ROW.PctPlazasVacantes}
                                            onChange={(e) => updateRow(index, 'PctPlazasVacantes', e.target.value)}
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
                                    <td className="px-4 py-3 text-right">{columnTotals.PctAtendidos.toFixed(2)}%</td>
                                    <td className="px-4 py-3 text-right">{columnTotals.PctVinculados.toFixed(2)}%</td>
                                    <td className="px-4 py-3 text-right">{columnTotals.PctColocados.toFixed(2)}%</td>
                                    <td className="px-4 py-3 text-right">{columnTotals.PctPlazasVacantes.toFixed(2)}%</td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TipoMetaParticipacion;
