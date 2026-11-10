import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const RUBROS_BASE = [
    { key: 'Atendidos', label: 'Atendidos' },
    { key: 'Postulados', label: 'Postulados' },
    { key: 'Colocados', label: 'Colocados' },
    { key: 'Plazas vacantes', label: 'Plazas vacantes' },
];

const RUBRO_INDEX_BY_CODE = {
    GLOB_ATEND: 0,
    GLOB_POST: 1,
    GLOB_COLOC: 2,
    GLOB_VAC: 3,
};

function createRubrosState(oficinas) {
    return RUBROS_BASE.map((rubro) => ({
        ...rubro,
        total: '',
        mensual: Array.from({ length: 12 }, () => ''),
        oficinas: oficinas.map((oficina) => ({
            id: oficina.id,
            label: oficina.label,
            participacion: ''
        }))
    }));
}

function getOfficeMonthlyDisplayValue(rubro, officeIndex, monthIndex) {
    const monthlyTotal = Number(rubro?.mensual?.[monthIndex]) || 0;
    const participation = Number(rubro?.oficinas?.[officeIndex]?.participacion) || 0;

    if (!rubro?.oficinas?.length) return 0;

    if (officeIndex === rubro.oficinas.length - 1) {
        const previousTotal = rubro.oficinas.slice(0, officeIndex).reduce((sum, office) => {
            const officeParticipation = Number(office.participacion) || 0;
            return sum + ((monthlyTotal * officeParticipation) / 100);
        }, 0);

        return Math.round((monthlyTotal - previousTotal) * 100) / 100;
    }

    return Math.round(((monthlyTotal * participation) / 100) * 100) / 100;
}

function getOfficeAnnualDisplayValue(rubro, officeIndex) {
    const total = Number(rubro?.total) || 0;
    const participation = Number(rubro?.oficinas?.[officeIndex]?.participacion) || 0;

    if (!rubro?.oficinas?.length) return 0;

    if (officeIndex === rubro.oficinas.length - 1) {
        const previousTotal = rubro.oficinas.slice(0, officeIndex).reduce((sum, office) => {
            const officeParticipation = Number(office.participacion) || 0;
            return sum + ((total * officeParticipation) / 100);
        }, 0);

        return Math.round((total - previousTotal) * 100) / 100;
    }

    return Math.round(((total * participation) / 100) * 100) / 100;
}

const AsignacionMetasGlobales = () => {
    const [oficinas, setOficinas] = useState([]);
    const [rubros, setRubros] = useState(() => createRubrosState([]));
    const [anio, setAnio] = useState(new Date().getFullYear());
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [loadingOficinas, setLoadingOficinas] = useState(true);
    const [activeRubro, setActiveRubro] = useState(0);

    useEffect(() => {
        const loadOficinas = async () => {
            try {
                setLoadingOficinas(true);
                const res = await api.get('/avances/oficinas');
                const officeList = res.data || [];
                setOficinas(officeList);
                setRubros(createRubrosState(officeList));
                await loadSavedAssignments(officeList);
            } catch (error) {
                console.error('Error al cargar oficinas', error);
                setOficinas([]);
                setRubros(createRubrosState([]));
            }
            finally {
                setLoadingOficinas(false);
            }
        };

        loadOficinas();
    }, []);

    useEffect(() => {
        if (!loadingOficinas && oficinas.length > 0) {
            loadSavedAssignments(oficinas);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [anio, loadingOficinas, oficinas.length]);

    const currentRubro = rubros[activeRubro] || null;

    const currentParticipationTotal = useMemo(() => {
        if (!currentRubro) return 0;
        return currentRubro.oficinas.reduce((sum, oficina) => sum + (Number(oficina.participacion) || 0), 0);
    }, [currentRubro]);

    const currentMonthlyTotal = useMemo(() => {
        if (!currentRubro) return 0;
        return currentRubro.mensual.reduce((sum, value) => sum + (Number(value) || 0), 0);
    }, [currentRubro]);

    const loadSavedAssignments = async (officeList = oficinas) => {
        if (!officeList.length) return;

        try {
            setLoading(true);
            const res = await api.get(`/asignacion-global/resumen?anio=${anio}`);
            const savedData = res.data || {};
            const next = createRubrosState(officeList);

            if (Array.isArray(savedData.rubros) && savedData.rubros.length > 0) {
                savedData.rubros.forEach((rubro) => {
                    const rubroIndex = RUBRO_INDEX_BY_CODE[rubro.codigo];
                    if (rubroIndex === undefined || !next[rubroIndex]) return;

                    next[rubroIndex].total = Number(rubro.total || 0).toFixed(2);
                    next[rubroIndex].mensual = Array.from({ length: 12 }, (_, index) => Number(rubro.mensual?.[index] || 0).toFixed(2));

                    const officeIndexById = new Map(officeList.map((office, index) => [Number(office.id), index]));
                    (rubro.oficinas || []).forEach((office) => {
                        const officeIndex = officeIndexById.get(Number(office.id));
                        if (officeIndex === undefined || !next[rubroIndex].oficinas[officeIndex]) return;
                        next[rubroIndex].oficinas[officeIndex].participacion = Number(office.participacion || 0).toFixed(4);
                    });
                });

                setRubros(next);
                setActiveRubro(0);
                return;
            }

            const officeRows = Array.isArray(savedData) ? savedData : (savedData.oficinas || []);
            const monthRows = Array.isArray(savedData) ? [] : (savedData.mensual || []);

            if (officeRows.length > 0) {
                const officeIndexById = new Map(officeList.map((office, index) => [Number(office.id), index]));

                officeRows.forEach((row) => {
                    const rubroIndex = RUBRO_INDEX_BY_CODE[row.Codigo];
                    if (rubroIndex === undefined || !next[rubroIndex]) return;

                    next[rubroIndex].total = Number(row.TotalRubro || row.MetaAnual || 0).toFixed(2);

                    const officeIndex = officeIndexById.get(Number(row.IdOficina));
                    if (officeIndex === undefined || !next[rubroIndex].oficinas[officeIndex]) return;

                    next[rubroIndex].oficinas[officeIndex].participacion = Number(row.Participacion || 0).toFixed(4);
                });
            }

            if (monthRows.length > 0) {
                monthRows.forEach((row) => {
                    const rubroIndex = RUBRO_INDEX_BY_CODE[row.Codigo];
                    const monthIndex = Number(row.IdMes) - 1;
                    if (rubroIndex === undefined || !next[rubroIndex] || monthIndex < 0 || monthIndex >= 12) return;

                    next[rubroIndex].mensual[monthIndex] = Number(row.MetaMensual || 0).toFixed(2);
                });
            }

            setRubros(next);
            setActiveRubro(0);
        } catch (error) {
            console.error('Error al consultar asignación guardada', error);
            alert(error.response?.data?.message || 'No fue posible consultar la asignación guardada.');
        } finally {
            setLoading(false);
        }
    };

    const buildRubrosPayload = () => rubros.map((rubro) => ({
        nombre: rubro.label,
        total: Number(rubro.total),
        distribucionMensual: rubro.mensual.map((value) => Number(value)),
        oficinas: rubro.oficinas.map((office) => ({
            idOficina: office.id,
            oficina: office.label,
            participacion: Number(office.participacion),
        }))
    }));

    const validateRubrosPayload = (rubrosPayload) => {
        if (rubrosPayload.some((rubro) => !Number.isFinite(rubro.total) || rubro.total <= 0)) {
            return 'Captura un total válido para cada rubro.';
        }

        for (const rubro of rubrosPayload) {
            const sum = rubro.oficinas.reduce((acc, office) => acc + (Number(office.participacion) || 0), 0);
            if (Math.round(sum * 100) / 100 !== 100) {
                return `La suma de participaciones de ${rubro.nombre} debe ser 100%.`;
            }

            if (!Array.isArray(rubro.distribucionMensual) || rubro.distribucionMensual.length !== 12 || rubro.distribucionMensual.some((value) => !Number.isFinite(value) || value < 0)) {
                return `Captura los 12 importes mensuales válidos de ${rubro.nombre}.`;
            }

            const monthlySum = rubro.distribucionMensual.reduce((acc, value) => acc + value, 0);
            if (Math.abs(Math.round((monthlySum - rubro.total) * 100) / 100) > 0) {
                return `La suma mensual de ${rubro.nombre} debe ser igual a su total anual.`;
            }
        }

        return null;
    };

    const updateRubroTotal = (index, value) => {
        const next = [...rubros];
        next[index] = { ...next[index], total: value };
        setRubros(next);
    };

    const updateParticipation = (rubroIndex, officeIndex, value) => {
        const next = [...rubros];
        next[rubroIndex] = {
            ...next[rubroIndex],
            oficinas: next[rubroIndex].oficinas.map((office, idx) => (
                idx === officeIndex ? { ...office, participacion: value } : office
            ))
        };
        setRubros(next);
    };

    const updateMonthlyValue = (rubroIndex, monthIndex, value) => {
        const next = [...rubros];
        next[rubroIndex] = {
            ...next[rubroIndex],
            mensual: next[rubroIndex].mensual.map((monthValue, idx) => (
                idx === monthIndex ? value : monthValue
            ))
        };
        setRubros(next);
    };

    const fillEvenParticipation = (rubroIndex) => {
        const officeCount = rubros[rubroIndex]?.oficinas?.length || 0;
        if (!officeCount) return;
        const value = (100 / officeCount).toFixed(2);
        const next = [...rubros];
        next[rubroIndex] = {
            ...next[rubroIndex],
            oficinas: next[rubroIndex].oficinas.map((office) => ({ ...office, participacion: value }))
        };
        setRubros(next);
    };

    const fillEvenAll = () => {
        if (!oficinas.length) return;
        const value = (100 / oficinas.length).toFixed(2);
        setRubros((previous) => previous.map((rubro) => ({
            ...rubro,
            oficinas: rubro.oficinas.map((office) => ({ ...office, participacion: value }))
        })));
    };

    const handleGenerate = async () => {
        const rubrosPayload = buildRubrosPayload();
        const validationMessage = validateRubrosPayload(rubrosPayload);
        if (validationMessage) {
            alert(validationMessage);
            return;
        }

        try {
            setLoading(true);
            const res = await api.post('/asignacion-global/excel', {
                anio,
                rubros: rubrosPayload
            }, {
                responseType: 'blob'
            });

            const blob = new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Asignacion_Global_Metas_${anio}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al generar asignación global', error);
            alert(error.response?.data?.message || 'No fue posible generar el archivo.');
        } finally {
            setLoading(false);
        }
    };

    const validateSingleRubroPayload = (rubro) => {
        if (!Number.isFinite(rubro.total) || rubro.total <= 0) {
            return `Captura un total válido para el rubro ${rubro.nombre}.`;
        }

        const sum = rubro.oficinas.reduce((acc, office) => acc + (Number(office.participacion) || 0), 0);
        if (Math.round(sum * 100) / 100 !== 100) {
            return `La suma de participaciones de ${rubro.nombre} debe ser 100%. Actualmente suma ${sum.toFixed(2)}%.`;
        }

        if (!Array.isArray(rubro.distribucionMensual) || rubro.distribucionMensual.length !== 12 || rubro.distribucionMensual.some((value) => !Number.isFinite(value) || value < 0)) {
            return `Captura los 12 importes mensuales válidos de ${rubro.nombre}.`;
        }

        const monthlySum = rubro.distribucionMensual.reduce((acc, value) => acc + value, 0);
        if (Math.abs(Math.round((monthlySum - rubro.total) * 100) / 100) > 0.01) {
            return `La suma mensual de ${rubro.nombre} (${monthlySum.toFixed(2)}) debe ser igual a su total anual (${rubro.total.toFixed(2)}).`;
        }

        return null;
    };

    const handleSaveActive = async () => {
        if (!currentRubro) return;

        const activeRubroPayload = {
            nombre: currentRubro.label,
            total: Number(currentRubro.total),
            distribucionMensual: currentRubro.mensual.map((value) => Number(value)),
            oficinas: currentRubro.oficinas.map((office) => ({
                idOficina: office.id,
                oficina: office.label,
                participacion: Number(office.participacion),
            }))
        };

        const validationMessage = validateSingleRubroPayload(activeRubroPayload);
        if (validationMessage) {
            alert(validationMessage);
            return;
        }

        try {
            setSaving(true);
            const res = await api.post('/asignacion-global/guardar', {
                anio,
                rubros: [activeRubroPayload]
            });

            alert(res.data?.message || `Asignación de ${currentRubro.label} guardada correctamente.`);
        } catch (error) {
            console.error(`Error al guardar asignación de ${currentRubro.label}`, error);
            alert(error.response?.data?.message || 'No fue posible guardar la asignación.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-4 pb-12">
            <div className="bg-white rounded-lg shadow px-6 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Asignación global por rubro</h2>
                    <p className="text-sm text-gray-500">Define el total anual de cada rubro y la participación de cada oficina; la distribución mensual se calcula con el histórico del año anterior.</p>
                </div>

                <div className="flex flex-wrap gap-4 items-end bg-gray-50 p-3 rounded-lg border border-gray-100 shadow-inner">
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-gray-600">Año</label>
                        <input
                            type="number"
                            className="border rounded px-3 py-1.5 text-sm w-24 bg-white"
                            value={anio}
                            onChange={(e) => setAnio(parseInt(e.target.value) || new Date().getFullYear())}
                        />
                    </div>
                    <button
                        onClick={fillEvenAll}
                        className="px-4 py-2 rounded-md text-sm font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
                    >
                        Reparto equitativo general
                    </button>
                    <button
                        onClick={() => loadSavedAssignments(oficinas)}
                        disabled={loading || loadingOficinas || oficinas.length === 0}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition shadow-sm ${loading || loadingOficinas || oficinas.length === 0 ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-sky-600 text-white hover:bg-sky-700 hover:shadow-md'}`}
                    >
                        Consultar guardado
                    </button>
                    <button
                        onClick={handleSaveActive}
                        disabled={saving || loading || !currentRubro}
                        className={`px-5 py-2.5 rounded-md font-bold text-sm transition shadow-sm ${saving || loading || !currentRubro ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md'}`}
                    >
                        {saving ? 'Guardando...' : `Guardar ${currentRubro?.label || ''}`}
                    </button>
                    <button
                        onClick={handleGenerate}
                        disabled={loading || saving}
                        className={`px-5 py-2.5 rounded-md font-bold text-sm transition shadow-sm ${loading || saving ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#9D2449] text-white hover:bg-[#7a1c38] hover:shadow-md'}`}
                    >
                        {loading ? 'Generando...' : 'Generar Excel'}
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex flex-wrap gap-2">
                    {rubros.map((rubro, index) => (
                        <button
                            key={rubro.key}
                            onClick={() => setActiveRubro(index)}
                            className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeRubro === index ? 'bg-[#9D2449] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                        >
                            {rubro.label}
                        </button>
                    ))}
                </div>

                {loadingOficinas && (
                    <div className="px-6 py-10 text-center text-gray-500">
                        Cargando oficinas...
                    </div>
                )}

                {!loadingOficinas && oficinas.length === 0 && (
                    <div className="px-6 py-10 text-center text-gray-500 space-y-2">
                        <p className="font-semibold text-gray-700">No se encontraron oficinas para repartir.</p>
                        <p>Verifica la conexión con CatUnOperativa o vuelve a intentar recargar la página.</p>
                    </div>
                )}

                {currentRubro && oficinas.length > 0 && (
                    <div className="p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800">{currentRubro.label}</h3>
                                <p className="text-sm text-gray-500">Captura el total anual, la distribución mensual por rubro y el porcentaje por oficina.</p>
                            </div>
                            <div className="flex items-end gap-3">
                                <div className="flex flex-col gap-1">
                                    <label className="text-xs font-semibold text-gray-600">Total anual</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={currentRubro.total}
                                        onChange={(e) => updateRubroTotal(activeRubro, e.target.value)}
                                        className="border rounded px-3 py-1.5 text-sm w-36 bg-white"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-gray-700">Distribución mensual del rubro</p>
                                    <p className="text-xs text-gray-500">La suma de los 12 meses debe ser igual al total anual del rubro.</p>
                                </div>
                                <div className={`text-sm font-bold ${Math.round(currentMonthlyTotal * 100) / 100 === Math.round(Number(currentRubro.total || 0) * 100) / 100 ? 'text-green-600' : 'text-amber-600'}`}>
                                    Suma actual: {currentMonthlyTotal.toFixed(2)} / {Number(currentRubro.total || 0).toFixed(2)}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                                {currentRubro.mensual.map((value, monthIndex) => (
                                    <div key={`${currentRubro.key}-month-${monthIndex}`} className="flex flex-col gap-1">
                                        <label className="text-xs font-semibold text-gray-600">{['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'][monthIndex]}</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={value}
                                            onChange={(e) => updateMonthlyValue(activeRubro, monthIndex, e.target.value)}
                                            className="border rounded px-3 py-1.5 text-sm bg-white"
                                            placeholder="0.00"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-xs text-gray-500 flex items-center justify-between gap-3">
                            <span>La suma de participaciones para este rubro debe ser 100%.</span>
                            <span className={`font-bold ${Math.round(currentParticipationTotal * 100) / 100 === 100 ? 'text-green-600' : 'text-amber-600'}`}>
                                Suma actual: {currentParticipationTotal.toFixed(2)}%
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                                    <tr>
                                        <th className="px-4 py-3 min-w-[260px]">Oficina</th>
                                        <th className="px-4 py-3 w-32 text-right">Anual</th>
                                        <th className="px-4 py-3 w-32 text-right">Participación %</th>
                                        {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((month) => (
                                            <th key={`${currentRubro.key}-${month}`} className="px-3 py-3 w-24 text-right">{month}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentRubro.oficinas.map((oficina, index) => (
                                        <tr key={`${currentRubro.key}-${oficina.id}`} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 font-medium text-gray-700">{oficina.label}</td>
                                            <td className="px-4 py-2 text-right text-gray-700 font-semibold">
                                                {getOfficeAnnualDisplayValue(currentRubro, index).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-2">
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={oficina.participacion}
                                                    onChange={(e) => updateParticipation(activeRubro, index, e.target.value)}
                                                    className="w-full border rounded px-3 py-1.5 text-sm text-right border-gray-200 bg-gray-50"
                                                    placeholder="0.00"
                                                />
                                            </td>
                                            {currentRubro.mensual.map((_, monthIndex) => (
                                                <td key={`${currentRubro.key}-${oficina.id}-${monthIndex}`} className="px-3 py-2 text-right text-gray-700 bg-white">
                                                    {getOfficeMonthlyDisplayValue(currentRubro, index, monthIndex).toFixed(2)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-bold text-gray-800">
                                        <td className="px-4 py-2">TOTAL</td>
                                        <td className="px-4 py-2 text-right">{Number(currentRubro.total || 0).toFixed(2)}</td>
                                        <td className="px-4 py-2 text-right">100.00</td>
                                        {currentRubro.mensual.map((value, monthIndex) => (
                                            <td key={`${currentRubro.key}-total-${monthIndex}`} className="px-3 py-2 text-right">
                                                {Number(value || 0).toFixed(2)}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {!loadingOficinas && oficinas.length > 0 && !currentRubro && (
                    <div className="px-6 py-10 text-center text-gray-500">
                        Selecciona un rubro para capturar la distribución mensual y los porcentajes.
                    </div>
                )}
            </div>

            <div className="bg-white rounded-lg shadow px-6 py-4 border border-slate-100 text-sm text-slate-600">
                El libro generado traerá un resumen general y una hoja por rubro. Cada hoja reparte el total anual del rubro entre las oficinas según su participación y muestra la distribución mensual derivada en tiempo real.
            </div>
        </div>
    );
};

export default AsignacionMetasGlobales;