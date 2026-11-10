import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// ── Constantes ────────────────────────────────────────────────────────────────
const MESES = [
    { id: 1, label: 'Enero' }, { id: 2, label: 'Febrero' },
    { id: 3, label: 'Marzo' }, { id: 4, label: 'Abril' },
    { id: 5, label: 'Mayo' },  { id: 6, label: 'Junio' },
    { id: 7, label: 'Julio' }, { id: 8, label: 'Agosto' },
    { id: 9, label: 'Septiembre' }, { id: 10, label: 'Octubre' },
    { id: 11, label: 'Noviembre' }, { id: 12, label: 'Diciembre' },
];

const INDICADOR_COLORS = {
    Atendidos:  { meta: '#6366f1', real: '#818cf8' },
    Vinculados: { meta: '#0d9488', real: '#2dd4bf' },
    Colocados:  { meta: '#d97706', real: '#fbbf24' },
};

// ── Barra de progreso ─────────────────────────────────────────────────────────
const ProgressBar = ({ pct }) => {
    const clamped = Math.min(pct, 100);
    const color =
        pct >= 100 ? 'bg-green-500' :
        pct >= 70  ? 'bg-yellow-400' :
        pct >= 40  ? 'bg-orange-400' : 'bg-red-400';

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${color}`}
                    style={{ width: `${clamped}%` }}
                />
            </div>
            <span className={`text-xs font-semibold w-12 text-right ${
                pct >= 100 ? 'text-green-600' : pct >= 70 ? 'text-yellow-600' : 'text-orange-600'
            }`}>
                {pct.toFixed(1)}%
            </span>
        </div>
    );
};

// ── Tarjeta de resumen de indicador ──────────────────────────────────────────
const ResumenCard = ({ indicador, meta, real, pct }) => {
    const col = INDICADOR_COLORS[indicador] || {};
    return (
        <div className="bg-white rounded-lg shadow p-4 flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{indicador}</span>
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-2xl font-bold text-gray-800">{real.toLocaleString()}</p>
                    <p className="text-xs text-gray-400">Real de {meta.toLocaleString()} meta</p>
                </div>
                <span className={`text-lg font-bold ${pct >= 100 ? 'text-green-600' : pct >= 70 ? 'text-yellow-500' : 'text-orange-500'}`}>
                    {pct.toFixed(1)}%
                </span>
            </div>
            <ProgressBar pct={pct} />
        </div>
    );
};

// ── Componente principal ──────────────────────────────────────────────────────
const Avances = () => {
    const mesActual = new Date().getMonth() + 1;

    // Use actual month instead of restricting to April
    const [mes, setMes]           = useState(mesActual);
    const [segmento, setSegmento] = useState('General');
    const [data, setData]         = useState([]);
    const [loading, setLoading]   = useState(false);
    const [error, setError]       = useState(null);
    const [segmentosList, setSegmentosList] = useState(['General']);

    const fetchSegmentos = useCallback(async () => {
        try {
            const res = await api.get('/avances/segmentos');
            const dataSegments = res.data.map(s => s.Nombre || s);
            setSegmentosList(['General', ...dataSegments]);
        } catch (err) {
            console.error('Error loading segments', err);
        }
    }, []);

    const fetchAvances = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/avances/bt', {
                params: { mes, anio: 2026, segmento }
            });
            setData(res.data.data || []);
        } catch (err) {
            setError('No se pudieron cargar los avances. Verifique la conexión.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [mes, segmento]);

    useEffect(() => { 
        fetchSegmentos();
    }, [fetchSegmentos]);

    useEffect(() => { 
        fetchAvances(); 
    }, [fetchAvances, segmento]); // automatically refetch on segment change

    const handleExportExcel = async () => {
        try {
            const res = await api.get('/avances/export', {
                params: { mes, anio: 2026, segmento },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            const mesLabelForFile = MESES.find(m=>m.id===mes)?.label.toUpperCase() || '';
            link.setAttribute('download', `Avances_Mensual_${mesLabelForFile}_2026.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error('Error al exportar Excel', err);
            alert('Hubo un error al descargar el reporte de Excel.');
        }
    };

    // ── Transformar respuesta (MetaAgg) a filas por Oficina+Indicador (retro-compatibilidad)
    const normalizedRows = (() => {
        // If backend returns aggregated rows (with MetaAtendidos etc) convert to indicator rows
        if (data.length === 0) return [];
        const sample = data[0];
        if (sample.MetaAtendidos !== undefined) {
            // convert each agg row into three indicator rows
            const out = [];
            data.forEach(r => {
                out.push({ Oficina: r.Oficina, Indicador: 'Atendidos', MetaRequerida: r.MetaAtendidos || 0, RealObtenido: r.RealAtendidos || 0, PorcentajeAvance: r.PorcAtendidos || 0 });
                out.push({ Oficina: r.Oficina, Indicador: 'Vinculados', MetaRequerida: r.MetaVinculados || 0, RealObtenido: r.RealVinculados || 0, PorcentajeAvance: r.PorcVinculados || 0 });
                out.push({ Oficina: r.Oficina, Indicador: 'Colocados', MetaRequerida: r.MetaColocados || 0, RealObtenido: r.RealColocados || 0, PorcentajeAvance: r.PorcColocados || 0 });
            });
            return out;
        }
        // already in legacy format
        return data;
    })();

    const chartData = (() => {
        const oficinas = [...new Set(normalizedRows.map(d => d.Oficina))];
        return oficinas.map(ofi => {
            const row = { oficina: ofi };
            ['Atendidos', 'Vinculados', 'Colocados'].forEach(ind => {
                const reg = normalizedRows.find(d => d.Oficina === ofi && d.Indicador === ind);
                if (reg) {
                    row[`${ind}_Meta`] = reg.MetaRequerida;
                    row[`${ind}_Real`] = reg.RealObtenido;
                } else {
                    row[`${ind}_Meta`] = 0;
                    row[`${ind}_Real`] = 0;
                }
            });
            return row;
        });
    })();

    // ── Totales por indicador ─────────────────────────────────────────────────
    const totales = ['Atendidos', 'Vinculados', 'Colocados'].map(ind => {
        const filas = normalizedRows.filter(d => d.Indicador === ind);
        const meta  = filas.reduce((s, d) => s + (d.MetaRequerida  || 0), 0);
        const real  = filas.reduce((s, d) => s + (d.RealObtenido   || 0), 0);
        return { indicador: ind, meta, real, pct: meta > 0 ? (real / meta) * 100 : 0 };
    });

    const mesLabel = MESES.find(m => m.id === mes)?.label || '';

    return (
        <div className="space-y-6 pb-12">

            {/* ── Encabezado y filtros ── */}
            <div className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Avances de Buscadores de Trabajo</h2>
                    <p className="text-sm text-gray-500">Comparativo Meta vs Real · 2026</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Selector Mes */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 font-medium">Mes</label>
                        <select
                            value={mes}
                            onChange={e => setMes(Number(e.target.value))}
                            className="border border-gray-300 rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500"
                        >
                            {MESES.map(m => (
                                <option key={m.id} value={m.id}>{m.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Selector Segmento */}
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 font-medium">Segmento</label>
                        <select
                            value={segmento}
                            onChange={e => setSegmento(e.target.value)}
                            className="border border-gray-300 rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-green-500"
                        >
                            {segmentosList.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleExportExcel}
                        className="mt-4 md:mt-0 self-end bg-blue-600 text-white text-sm font-medium px-4 py-1.5 rounded-md hover:bg-blue-700 transition flex items-center gap-2"
                        title="Exportar a Excel (Formato Semanal)"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        Exportar
                    </button>
                    <button
                        onClick={fetchAvances}
                        className="mt-4 md:mt-0 self-end bg-green-600 text-white text-sm font-medium px-4 py-1.5 rounded-md hover:bg-green-700 transition"
                    >
                        Actualizar
                    </button>
                </div>
            </div>

            {/* ── Estado vacío / error / carga ── */}
            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[1,2,3].map(i => (
                        <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse h-24" />
                    ))}
                </div>
            )}

            {!loading && error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
                    {error}
                </div>
            )}

            {!loading && !error && data.length === 0 && (
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm rounded-lg p-4">
                    No se encontraron datos para <strong>{mesLabel}</strong> · Segmento: <strong>{segmento}</strong>.
                    Verifica que el SP <code>sp_GetAvancesBT</code> esté ejecutado en SQL Server.
                </div>
            )}

            {!loading && !error && data.length > 0 && (
                <>
                    {/* ── Tarjetas de resumen ── */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {totales.map(t => (
                            <ResumenCard key={t.indicador} {...t} />
                        ))}
                    </div>

                    {/* ── Gráfica de barras agrupadas ── */}
                    <div className="bg-white rounded-lg shadow p-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">
                            Meta vs Real por Oficina — {mesLabel} · {segmento}
                        </h3>
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="oficina" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                <Bar dataKey="Atendidos_Meta"  name="Atendidos Meta"  fill={INDICADOR_COLORS.Atendidos.meta}  radius={[3,3,0,0]} />
                                <Bar dataKey="Atendidos_Real"  name="Atendidos Real"  fill={INDICADOR_COLORS.Atendidos.real}  radius={[3,3,0,0]} />
                                <Bar dataKey="Vinculados_Meta" name="Vinculados Meta" fill={INDICADOR_COLORS.Vinculados.meta} radius={[3,3,0,0]} />
                                <Bar dataKey="Vinculados_Real" name="Vinculados Real" fill={INDICADOR_COLORS.Vinculados.real} radius={[3,3,0,0]} />
                                <Bar dataKey="Colocados_Meta"  name="Colocados Meta"  fill={INDICADOR_COLORS.Colocados.meta}  radius={[3,3,0,0]} />
                                <Bar dataKey="Colocados_Real"  name="Colocados Real"  fill={INDICADOR_COLORS.Colocados.real}  radius={[3,3,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* ── Detalle por Oficina (Apartado para cada oficina) ── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                        {chartData.map((ofiData, i) => (
                            <div key={i} className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
                                <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
                                    <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                        {ofiData.oficina}
                                    </h3>
                                </div>
                                <div className="p-5 space-y-5">
                                    {['Atendidos', 'Vinculados', 'Colocados'].map(ind => {
                                        const meta = ofiData[`${ind}_Meta`] || 0;
                                        const real = ofiData[`${ind}_Real`] || 0;
                                        const diff = real - meta;
                                        const pct = meta > 0 ? (real / meta) * 100 : 0;
                                        
                                        return (
                                            <div key={ind} className="flex flex-col gap-1.5">
                                                <div className="flex justify-between items-center text-sm">
                                                    <span className="font-semibold text-gray-700 w-24">{ind}</span>
                                                    <span className="text-gray-500 flex-1 text-right">
                                                        <strong className="text-gray-800">{real.toLocaleString()}</strong> / {meta.toLocaleString()}
                                                        <span className={`ml-2 text-xs font-semibold ${diff >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                                                            ({diff >= 0 ? '+' : ''}{diff.toLocaleString()})
                                                        </span>
                                                    </span>
                                                </div>
                                                <ProgressBar pct={pct} />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default Avances;

