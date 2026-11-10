import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const GLOBAL_RUBROS = [
    { key: 'atendidos', searchKeys: ['atendidos'], label: 'Atendidos', rowKey: 'MetaAtendidos', pctKey: 'PctAtendidos' },
    { key: 'vinculados', searchKeys: ['vinculados', 'postulados'], label: 'Vinculados / Postulados', rowKey: 'MetaVinculados', pctKey: 'PctVinculados' },
    { key: 'colocados', searchKeys: ['colocados'], label: 'Colocados', rowKey: 'MetaColocados', pctKey: 'PctColocados' },
    { key: 'plazas vacantes', searchKeys: ['plazas vacantes', 'vacantes'], label: 'Plazas vacantes', rowKey: 'MetaPlazasVacantes', pctKey: 'PctPlazasVacantes' },
];

const MESES = [
    { id: 1, label: 'Enero' }, { id: 2, label: 'Febrero' },
    { id: 3, label: 'Marzo' }, { id: 4, label: 'Abril' },
    { id: 5, label: 'Mayo' },  { id: 6, label: 'Junio' },
    { id: 7, label: 'Julio' }, { id: 8, label: 'Agosto' },
    { id: 9, label: 'Septiembre' }, { id: 10, label: 'Octubre' },
    { id: 11, label: 'Noviembre' }, { id: 12, label: 'Diciembre' },
];

const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const normalizeText = (value) => String(value || '').trim().toLowerCase();

const findResumenValue = (resumen, keys) => {
    const normalizedKeys = keys.map(normalizeText);
    const found = resumen.find((item) => {
        const rubro = normalizeText(item.RubroGlobal);
        return normalizedKeys.some((key) => rubro === key || rubro.includes(key) || key.includes(rubro));
    });

    return Number(found?.MetaMensual || 0);
};

const MetasCRUD = () => {
    const [tiposMeta, setTiposMeta] = useState([]);
    const [oficinas, setOficinas] = useState([]);
    const [loading, setLoading] = useState(false);
    const [globalResumen, setGlobalResumen] = useState([]);
    
    // Filtros globales
    const [anioGlobal, setAnioGlobal] = useState(new Date().getFullYear());
    const [mesGlobal, setMesGlobal] = useState(new Date().getMonth() + 1);
    const [oficinaGlobal, setOficinaGlobal] = useState(1);

    // Grid Data
    const [rows, setRows] = useState([]);

    const fetchOficinas = useCallback(async () => {
        try {
            const res = await api.get('/avances/oficinas');
            setOficinas(res.data);
            if (res.data.length > 0 && oficinaGlobal === 1) {
                setOficinaGlobal(res.data[0].id);
            }
        } catch (error) {
            console.error('Error al cargar oficinas', error);
        }
    }, [oficinaGlobal]);

    const fetchTiposMeta = useCallback(async () => {
        try {
            const res = await api.get('/avances/segmentos');
            setTiposMeta(res.data.filter(t => t.TipoMetaId !== null));
        } catch (error) {
            console.error('Error al cargar tipos de meta', error);
        }
    }, []);

    const fetchParticipacionGlobal = useCallback(async () => {
        try {
            const res = await api.get('/tipo-meta-participacion');
            return Array.isArray(res.data) ? res.data : [];
        } catch (error) {
            console.error('Error al cargar participación global', error);
            return [];
        }
    }, []);

    const fetchMetasPorPeriodo = useCallback(async () => {
        if (tiposMeta.length === 0 || oficinas.length === 0) return;
        setLoading(true);
        try {
            // 1. Obtener metas guardadas en base de datos
            const res = await api.get(`/metas?anio=${anioGlobal}&mes=${mesGlobal}&oficina_id=${oficinaGlobal}`);
            const existingMetas = res.data || [];

            // 2. Obtener participaciones globales de tipos de meta
            const participacionGlobal = await fetchParticipacionGlobal();
            const participacionByTipoMeta = new Map(
                participacionGlobal.map((row) => [Number(row.TipoMetaId), row])
            );

            // 3. Obtener asignación global de metas del año
            let mappedResumen = [];
            try {
                const resResumen = await api.get(`/asignacion-global/resumen?anio=${anioGlobal}`);
                const rubrosList = resResumen.data?.rubros || [];
                const monthIndex = Number(mesGlobal) - 1;
                const officeIdNum = Number(oficinaGlobal);
                
                mappedResumen = rubrosList.map((rubro) => {
                    const offices = rubro.oficinas || [];
                    const officeIndex = offices.findIndex(o => Number(o.id) === officeIdNum);
                    
                    let metaMensual = 0;
                    if (officeIndex !== -1) {
                        const monthlyTotal = Number(rubro.mensual?.[monthIndex]) || 0;
                        const participation = Number(offices[officeIndex]?.participacion) || 0;
                        
                        if (officeIndex === offices.length - 1) {
                            const previousTotal = offices.slice(0, officeIndex).reduce((sum, office) => {
                                const officeParticipation = Number(office.participacion) || 0;
                                return sum + ((monthlyTotal * officeParticipation) / 100);
                            }, 0);
                            metaMensual = Math.round((monthlyTotal - previousTotal) * 100) / 100;
                        } else {
                            metaMensual = Math.round(((monthlyTotal * participation) / 100) * 100) / 100;
                        }
                    }
                    
                    return {
                        RubroGlobal: rubro.nombre,
                        MetaMensual: metaMensual
                    };
                });
            } catch (errResumen) {
                console.error('Error al obtener la asignación global de metas:', errResumen);
            }
            setGlobalResumen(mappedResumen);

            // 4. Calcular e inducir distribución si no hay datos previamente guardados en la BD
            const attended = findResumenValue(mappedResumen, ['atendidos']);
            const linked = findResumenValue(mappedResumen, ['vinculados', 'postulados']);
            const placed = findResumenValue(mappedResumen, ['colocados']);
            const vacancies = findResumenValue(mappedResumen, ['plazas vacantes', 'vacantes']);

            const initialRows = tiposMeta.map(tm => {
                const existing = existingMetas.find(m => m.TipoMetaId === tm.TipoMetaId);
                const participation = participacionByTipoMeta.get(Number(tm.TipoMetaId)) || {};

                const pctAtendidos = Number(participation.PctAtendidos || existing?.PctAtendidos || 0);
                const pctVinculados = Number(participation.PctVinculados || existing?.PctVinculados || 0);
                const pctColocados = Number(participation.PctColocados || existing?.PctColocados || 0);
                const pctPlazasVacantes = Number(participation.PctPlazasVacantes || existing?.PctPlazasVacantes || 0);

                let metaAtendidos = '';
                let metaVinculados = '';
                let metaColocados = '';
                let metaPlazasVacantes = '';
                let isModified = false;

                if (existing) {
                    metaAtendidos = existing.MetaAtendidos;
                    metaVinculados = existing.MetaVinculados;
                    metaColocados = existing.MetaColocados;
                    metaPlazasVacantes = existing.MetaPlazasVacantes !== undefined ? existing.MetaPlazasVacantes : '';
                } else {
                    // Pre-llenar automáticamente
                    metaAtendidos = round2(attended * pctAtendidos / 100);
                    metaVinculados = round2(linked * pctVinculados / 100);
                    metaColocados = round2(placed * pctColocados / 100);
                    metaPlazasVacantes = round2(vacancies * pctPlazasVacantes / 100);
                    isModified = true; // Cambios pendientes de guardar
                }

                return {
                    TipoMetaId: tm.TipoMetaId,
                    Nombre: tm.Nombre,
                    Id: existing ? existing.Id : null,
                    MetaAtendidos: metaAtendidos,
                    MetaVinculados: metaVinculados,
                    MetaColocados: metaColocados,
                    MetaPlazasVacantes: metaPlazasVacantes,
                    PctAtendidos: pctAtendidos.toFixed(4),
                    PctVinculados: pctVinculados.toFixed(4),
                    PctColocados: pctColocados.toFixed(4),
                    PctPlazasVacantes: pctPlazasVacantes.toFixed(4),
                    _isModified: isModified
                };
            });
            setRows(initialRows);
        } catch (error) {
            console.error('Error fetching metas', error);
        } finally {
            setLoading(false);
        }
    }, [anioGlobal, mesGlobal, oficinaGlobal, tiposMeta, oficinas]);

    useEffect(() => {
        fetchOficinas();
        fetchTiposMeta();
    }, [fetchOficinas, fetchTiposMeta]);

    useEffect(() => {
        fetchMetasPorPeriodo();
    }, [fetchMetasPorPeriodo]);

    const handleRowChange = (index, field, value) => {
        const newRows = [...rows];
        newRows[index] = {
            ...newRows[index],
            [field]: value,
            _isModified: true
        };
        setRows(newRows);
    };

    const getPctColumnTotal = (field) => rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0);

    const validatePctColumns = () => {
        const pctChecks = [
            ['PctAtendidos', '% Atendidos'],
            ['PctVinculados', '% Vinculados'],
            ['PctColocados', '% Colocados'],
            ['PctPlazasVacantes', '% Vacantes'],
        ];

        for (const [field, label] of pctChecks) {
            const total = Math.round(getPctColumnTotal(field) * 100) / 100;
            if (Math.abs(total - 100) > 0.01) {
                return `La suma de ${label} debe ser 100%. Actualmente suma ${total.toFixed(2)}%.`;
            }
        }

        return null;
    };

    // handleLoadGlobalResumen ya no es necesario dado que el cálculo se realiza automáticamente en fetchMetasPorPeriodo

    const handleSaveAll = async () => {
        const modifiedRows = rows.filter(r => r._isModified);
        if (modifiedRows.length === 0) {
            alert('No hay cambios pendientes para guardar.');
            return;
        }

        try {
            setLoading(true);
            const promises = modifiedRows.map(row => {
                const payload = {
                    IdOficina: parseInt(oficinaGlobal),
                    Oficina: oficinas.find(o => o.id === parseInt(oficinaGlobal))?.label || '',
                    IdMes: parseInt(mesGlobal),
                    Mes: MESES.find(m => m.id === parseInt(mesGlobal))?.label || '',
                    Anio: parseInt(anioGlobal),
                    TipoMetaId: parseInt(row.TipoMetaId),
                    MetaAtendidos: parseFloat(row.MetaAtendidos || 0),
                    MetaVinculados: parseFloat(row.MetaVinculados || 0),
                    MetaColocados: parseFloat(row.MetaColocados || 0),
                    MetaPlazasVacantes: parseFloat(row.MetaPlazasVacantes || 0),
                    PctAtendidos: parseFloat(row.PctAtendidos || 0),
                    PctVinculados: parseFloat(row.PctVinculados || 0),
                    PctColocados: parseFloat(row.PctColocados || 0),
                    PctPlazasVacantes: parseFloat(row.PctPlazasVacantes || 0),
                };
                return api.post('/metas', payload);
            });

            await Promise.all(promises);
            alert('Metas guardadas/actualizadas exitosamente.');
            fetchMetasPorPeriodo();
        } catch (error) {
            console.error('Error bulk saving metas', error);
            alert('Se produjo un error al guardar algunas líneas.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4 pb-12">
            <div className="bg-white rounded-lg shadow px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Asignación por Tipo de Metas</h2>
                    <p className="text-sm text-gray-500">Selecciona el periodo y la oficina. Las metas mensuales se distribuyen automáticamente según el porcentaje de participación.</p>
                    <p className="text-xs text-amber-700 mt-1">Plazas vacantes se calcula como referencia para el reparto global.</p>
                </div>
                
                <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-inner">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-600">Año</label>
                        <input 
                            type="number" 
                            className="border rounded px-3 py-1.5 text-sm w-24 bg-white"
                            value={anioGlobal} 
                            onChange={(e) => setAnioGlobal(parseInt(e.target.value) || new Date().getFullYear())} 
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-600">Mes</label>
                        <select 
                            className="border rounded px-3 py-1.5 text-sm bg-white"
                            value={mesGlobal} 
                            onChange={(e) => setMesGlobal(parseInt(e.target.value))}
                        >
                            {MESES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-indigo-700 font-bold uppercase">Oficina a Capturar</label>
                        <select 
                            className="border rounded px-4 py-1.5 text-sm font-semibold text-indigo-800 bg-indigo-50 border-indigo-300"
                            value={oficinaGlobal} 
                            onChange={(e) => setOficinaGlobal(parseInt(e.target.value))}
                        >
                            {oficinas.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                    </div>
                    {loading && <span className="text-sm text-indigo-600 font-bold mb-1">Cargando...</span>}
                </div>
            </div>

            <div className="bg-white rounded-lg shadow px-6 py-4 border border-emerald-100">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                        <h3 className="font-semibold text-gray-700">Distribución por tipo de meta</h3>
                        <p className="text-sm text-gray-500">Captura el porcentaje por fila y usa la meta global del periodo para autollenar los importes.</p>
                    </div>
                    {globalResumen.length > 0 && (
                        <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                            {globalResumen.length} rubro(s) global(es) cargado(s)
                        </div>
                    )}
                </div>

                {globalResumen.length > 0 && (
                    <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4 text-sm">
                        {GLOBAL_RUBROS.map((rubro) => {
                            const value = findResumenValue(globalResumen, rubro.searchKeys);
                            return (
                                <div key={rubro.key} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                                    <div className="text-xs uppercase tracking-wide text-gray-500">{rubro.label}</div>
                                    <div className="text-lg font-bold text-gray-800">{value.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="mt-4 grid gap-2 md:grid-cols-4 text-xs text-gray-600">
                    <div className="rounded-md bg-gray-50 border border-gray-100 px-3 py-2">
                        <div className="font-semibold text-gray-700">% Atendidos</div>
                        <div>{Math.round(getPctColumnTotal('PctAtendidos') * 100) / 100}%</div>
                    </div>
                    <div className="rounded-md bg-gray-50 border border-gray-100 px-3 py-2">
                        <div className="font-semibold text-gray-700">% Vinculados</div>
                        <div>{Math.round(getPctColumnTotal('PctVinculados') * 100) / 100}%</div>
                    </div>
                    <div className="rounded-md bg-gray-50 border border-gray-100 px-3 py-2">
                        <div className="font-semibold text-gray-700">% Colocados</div>
                        <div>{Math.round(getPctColumnTotal('PctColocados') * 100) / 100}%</div>
                    </div>
                    <div className="rounded-md bg-gray-50 border border-gray-100 px-3 py-2">
                        <div className="font-semibold text-gray-700">% Vacantes</div>
                        <div>{Math.round(getPctColumnTotal('PctPlazasVacantes') * 100) / 100}%</div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-700">Segmentos - {oficinas.find(o => o.id === parseInt(oficinaGlobal))?.label}</h3>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                            <tr>
                                <th className="px-4 py-3 min-w-[250px]">Categoría / Segmento</th>
                                <th className="px-4 py-3 w-32 text-right">% Atendidos</th>
                                <th className="px-4 py-3 w-32 text-right">% Vinculados</th>
                                <th className="px-4 py-3 w-32 text-right">% Colocados</th>
                                <th className="px-4 py-3 w-32 text-right">% Vacantes</th>
                                <th className="px-4 py-3 w-40 text-right">Atendidos</th>
                                <th className="px-4 py-3 w-40 text-right">Vinculados</th>
                                <th className="px-4 py-3 w-40 text-right">Colocados</th>
                                <th className="px-4 py-3 w-40 text-right">Vacantes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.length === 0 && !loading && (
                                <tr>
                                    <td colSpan="9" className="px-4 py-8 text-center text-gray-500 bg-gray-50">
                                        No hay segmentos disponibles. Asegúrate que la base de datos tenga segmentos configurados.
                                    </td>
                                </tr>
                            )}
                            {rows.map((row, index) => (
                                <tr key={index} className={row._isModified ? "bg-amber-50" : "hover:bg-gray-50"}>
                                    <td className="px-4 py-2 font-medium text-gray-700">
                                        {row.Nombre}
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" step="0.01" 
                                            value={row.PctAtendidos} 
                                            readOnly
                                            className="w-full border rounded px-3 py-1.5 text-sm text-right border-gray-200 bg-gray-100 text-gray-600"
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" step="0.01" 
                                            value={row.PctVinculados} 
                                            readOnly
                                            className="w-full border rounded px-3 py-1.5 text-sm text-right border-gray-200 bg-gray-100 text-gray-600"
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" step="0.01" 
                                            value={row.PctColocados} 
                                            readOnly
                                            className="w-full border rounded px-3 py-1.5 text-sm text-right border-gray-200 bg-gray-100 text-gray-600"
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" step="0.01" 
                                            value={row.PctPlazasVacantes} 
                                            readOnly
                                            className="w-full border rounded px-3 py-1.5 text-sm text-right border-gray-200 bg-gray-100 text-gray-600"
                                            placeholder="0.00"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" step="0.01" 
                                            value={row.MetaAtendidos} 
                                            onChange={(e) => handleRowChange(index, 'MetaAtendidos', e.target.value)}
                                            className={`w-full border rounded px-3 py-1.5 text-sm text-right ${row._isModified ? 'border-amber-400 bg-white ring-1 ring-amber-400' : 'border-gray-200 bg-gray-50'}`}
                                            placeholder="0.0"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" step="0.01" 
                                            value={row.MetaVinculados} 
                                            onChange={(e) => handleRowChange(index, 'MetaVinculados', e.target.value)}
                                            className={`w-full border rounded px-3 py-1.5 text-sm text-right ${row._isModified ? 'border-amber-400 bg-white ring-1 ring-amber-400' : 'border-gray-200 bg-gray-50'}`}
                                            placeholder="0.0"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" step="0.01" 
                                            value={row.MetaColocados} 
                                            onChange={(e) => handleRowChange(index, 'MetaColocados', e.target.value)}
                                            className={`w-full border rounded px-3 py-1.5 text-sm text-right ${row._isModified ? 'border-amber-400 bg-white ring-1 ring-amber-400' : 'border-gray-200 bg-gray-50'}`}
                                            placeholder="0.0"
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <input 
                                            type="number" step="0.01" 
                                            value={row.MetaPlazasVacantes} 
                                            onChange={(e) => handleRowChange(index, 'MetaPlazasVacantes', e.target.value)}
                                            className={`w-full border rounded px-3 py-1.5 text-sm text-right ${row._isModified ? 'border-amber-400 bg-white ring-1 ring-amber-400' : 'border-gray-200 bg-gray-50'}`}
                                            placeholder="0.0"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-medium">
                        {rows.filter(r => r._isModified).length} segmento(s) con cambios sin guardar.
                    </span>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleSaveAll}
                            disabled={rows.filter(r => r._isModified).length === 0 || loading}
                            className={`px-8 py-2.5 rounded-md font-bold text-sm transition shadow-sm ${rows.filter(r => r._isModified).length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md'}`}
                        >
                            {loading ? 'Guardando...' : 'Guardar Todos (Bulk)'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MetasCRUD;