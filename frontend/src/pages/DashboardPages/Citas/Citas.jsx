import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  XCircle,
  UserRound,
  Eye,
  AlertCircle,
  UserRoundCheck,
} from "lucide-react";

import CommonModule from "../../../components/common/CommonModule";
import EstadoBadge from "../../../components/common/EstadoBadge";
import SectionHeader from "../../../components/common/SectionHeader";
import api from "../../../services/api";

import "./Citas.css";

// =========================================================
// HELPERS
// =========================================================
const obtenerPrimerDiaMes = () => {
  const fecha = new Date();
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-01`;
};

const obtenerUltimoDiaMes = () => {
  const fecha = new Date();
  const ultimoDia = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
};

const formatearFecha = (fecha) => {
  if (!fecha) return "-";
  const partes = String(fecha).split("-");
  if (partes.length === 3) return `${partes[2]}/${partes[1]}/${partes[0]}`;
  return fecha;
};

const formatearHora = (hora) => {
  if (!hora) return "-";
  if (typeof hora === "string") {
    const partes = hora.split(":");
    if (partes.length >= 2) return `${partes[0]}:${partes[1]}`;
  }
  return hora;
};

const REGISTROS_POR_PAGINA = 100;

// =========================================================
// COMPONENTE
// =========================================================
export default function Citas() {
  const [citas, setCitas] = useState([]);
  const [conteos, setConteos] = useState({
    total: 0,
    atendidas: 0,
    enEspera: 0,
    noSePresento: 0,
    noContesto: 0,
    canceladas: 0,
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);

  const [municipiosOptions, setMunicipiosOptions] = useState(["Todos"]);
  const [tiposOptions, setTiposOptions] = useState(["Todos"]);

  const [busqueda, setBusqueda] = useState("");
  const [filtroMunicipio, setFiltroMunicipio] = useState("Todos");
  const [filtroTipo, setFiltroTipo] = useState("Todos");

  const location = useLocation();
  const statePeriodo = location.state?.periodo;
  const stateInicio = location.state?.inicio;
  const stateFin = location.state?.fin;

  const [fechaInicial, setFechaInicial] = useState(() => {
    if (statePeriodo === "todos") return "";
    if (statePeriodo === "personalizado" && stateInicio) return stateInicio;
    return obtenerPrimerDiaMes();
  });
  const [fechaFinal, setFechaFinal] = useState(() => {
    if (statePeriodo === "todos") return "";
    if (statePeriodo === "personalizado" && stateFin) return stateFin;
    const hoy = new Date();
    return hoy.toISOString().split("T")[0];
  });
  const [periodo, setPeriodo] = useState(() => statePeriodo || "mensual");

  const [paginaActual, setPaginaActual] = useState(1);

  // =======================================================
  // PERIODOS
  // =======================================================
  const actualizarFechasPorPeriodo = (nuevoPeriodo) => {
    if (nuevoPeriodo === "todos") {
      setFechaInicial("");
      setFechaFinal("");
      setPeriodo(nuevoPeriodo);
      return;
    }

    const hoy = new Date();
    let inicio, fin;

    switch (nuevoPeriodo) {
      case "diario":
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        break;
      case "semanal":
        inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() - 6);
        fin = new Date(hoy);
        break;
      case "mensual":
        inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        break;
      case "anual":
        inicio = new Date(hoy.getFullYear(), 0, 1);
        fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        break;
      case "personalizado":
        return;
      default:
        return;
    }

    if (inicio && fin) {
      setFechaInicial(inicio.toISOString().split("T")[0]);
      setFechaFinal(fin.toISOString().split("T")[0]);
    }
    setPeriodo(nuevoPeriodo);
  };

  // =======================================================
  // CARGAR CITAS
  // =======================================================
  const cargarCitas = async () => {
    try {
      setCargando(true);
      setError("");

      if (fechaInicial && fechaFinal && fechaInicial > fechaFinal) {
        setError("La fecha inicial no puede ser mayor que la fecha final.");
        setCitas([]);
        return;
      }

      const params = new URLSearchParams();
      if (periodo) params.append("periodo", periodo);
      if (fechaInicial) params.append("fechaInicio", fechaInicial);
      if (fechaFinal) params.append("fechaFin", fechaFinal);

      if (filtroMunicipio && filtroMunicipio !== "Todos") params.append("municipio", filtroMunicipio);
      if (filtroTipo && filtroTipo !== "Todos") params.append("tipo", filtroTipo);
      if (busqueda.trim()) params.append("busqueda", busqueda.trim());

      const url = `/citas${params.toString() ? `?${params.toString()}` : ""}`;
      const respuesta = await api.get(url);
      const data = respuesta.data?.data || {};

      console.log(">>> RESPUESTA BACKEND:", {
        citas: data.citas?.length,
        conteos: data.conteos
      });

      setCitas(Array.isArray(data.citas) ? data.citas : []);
      setConteos(data.conteos || {
        total: 0,
        atendidas: 0,
        enEspera: 0,
        noSePresento: 0,
        noContesto: 0,
        canceladas: 0,
      });
      setMunicipiosOptions(data.municipios || ["Todos"]);
      setTiposOptions(data.tipos || ["Todos"]);

      setPaginaActual(1);
    } catch (err) {
      console.error("ERROR AL CARGAR CITAS:", err);
      setCitas([]);
      setError(err.response?.data?.message || "Error al cargar las citas.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCitas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicial, fechaFinal, filtroMunicipio, filtroTipo, busqueda]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroMunicipio("Todos");
    setFiltroTipo("Todos");
    setPeriodo("mensual");
    setFechaInicial(obtenerPrimerDiaMes());
    const hoy = new Date();
    setFechaFinal(hoy.toISOString().split("T")[0]);
    setPaginaActual(1);
  };

  // =======================================================
  // ✅ KPIs (Opción C: 5 indicadores, incluye TOTAL)
  // =======================================================
  const indicadores = [
    {
      id: "total",
      titulo: "Total Citas",
      valor: conteos.total,
      descripcion: "Todas las citas en el periodo",
      icono: CalendarDays,
      color: "blue",
    },
    {
      id: "atendidas",
      titulo: "Atendidas",
      valor: conteos.atendidas,
      descripcion: "Citas completadas",
      icono: CheckCircle2,
      color: "green",
    },
    {
      id: "en-espera",
      titulo: "En Espera",
      valor: conteos.enEspera,
      descripcion: "Pendientes de atención",
      icono: Clock3,
      color: "orange",
    },
    {
      id: "no-se-presento",
      titulo: "No se presentó",
      valor: conteos.noSePresento,
      descripcion: "Sin asistencia",
      icono: XCircle,
      color: "cyan",
    },
    {
      id: "no-contesto",
      titulo: "No contestó",
      valor: conteos.noContesto,
      descripcion: "Llamada no atendida",
      icono: AlertCircle,
      color: "purple",
    },
  ];

  // =======================================================
  // RESÚMENES
  // =======================================================
  const estadosResumen = useMemo(() => {
    const resumen = [];
    if (conteos.atendidas > 0) resumen.push(["Atendidas", conteos.atendidas]);
    if (conteos.enEspera > 0) resumen.push(["En Espera", conteos.enEspera]);
    if (conteos.noSePresento > 0) resumen.push(["No se presentó", conteos.noSePresento]);
    if (conteos.noContesto > 0) resumen.push(["No contestó", conteos.noContesto]);
    if (conteos.canceladas > 0) resumen.push(["Canceladas", conteos.canceladas]);
    return resumen.sort((a, b) => b[1] - a[1]);
  }, [conteos]);

  const proximasCitas = useMemo(() => citas.slice(0, 4), [citas]);

  // =======================================================
  // COLUMNAS
  // =======================================================
  const columnas = [
    { key: "fecha", label: "Fecha y Hora" },
    { key: "buscador", label: "Buscador" },
    { key: "tipo", label: "Tipo" },
    { key: "consejero", label: "Consejero" },
    { key: "estado", label: "Estado" },
    { key: "accion", label: "Acción" },
  ];

  const renderCelda = (cita, columnaKey) => {
    switch (columnaKey) {
      case "fecha":
        return (
          <div className="celda-principal">
            <strong>{formatearFecha(cita.fecha)}</strong>
            <small>
              <Clock3 size={11} style={{ display: "inline", marginRight: 3 }} />
              {formatearHora(cita.hora)}
            </small>
          </div>
        );
      case "buscador":
        return (
          <div className="celda-avatar">
            <div className="celda-avatar-icono blue">
              <UserRound size={15} />
            </div>
            <div className="celda-principal">
              <strong>{cita.nombre || "Sin nombre"}</strong>
              <small>{cita.curp || "-"}</small>
            </div>
          </div>
        );
      case "tipo":
        return <span>{cita.tipo || "-"}</span>;
      case "consejero":
        return (
          <div className="celda-principal">
            <strong>{cita.consejero || "Sin consejero"}</strong>
            <small>{cita.municipio || "-"}</small>
          </div>
        );
      case "estado":
        return <EstadoBadge estado={cita.estado || "Sin estatus"} />;
      case "accion":
        return (
          <button
            type="button"
            className="btn-ver"
            onClick={() => setCitaSeleccionada(cita)}
            title="Ver detalles"
          >
            <Eye size={14} />
            Ver
          </button>
        );
      default:
        return "-";
    }
  };

  // =======================================================
  // RENDER
  // =======================================================
  return (
    <>
      <CommonModule
        titulo="Citas"
        descripcion="Consulta y seguimiento de citas programadas."
        icono={CalendarDays}

        datos={citas}
        cargando={cargando}
        error={error}
        onRecargar={cargarCitas}

        indicadores={indicadores}

        columnas={columnas}
        renderCelda={renderCelda}
        filaKey={(fila, index) => fila.id ?? index}
        mensajeVacio="No se encontraron citas con los filtros seleccionados."

        fechaInicial={fechaInicial}
        setFechaInicial={(v) => { setFechaInicial(v); setPeriodo("personalizado"); }}
        fechaFinal={fechaFinal}
        setFechaFinal={(v) => { setFechaFinal(v); setPeriodo("personalizado"); }}
        periodo={periodo}
        setPeriodo={(v) => {
          if (v === "personalizado") setPeriodo(v);
          else actualizarFechasPorPeriodo(v);
        }}
        onConsultarFechas={() => { setPaginaActual(1); cargarCitas(); }}

        busqueda={busqueda}
        onBusqueda={setBusqueda}
        filtrosPersonalizados={
          <>
            <div>
              <label>Tipo de cita</label>
              <select
                value={filtroTipo}
                onChange={(e) => { setFiltroTipo(e.target.value); setPaginaActual(1); }}
              >
                {tiposOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Municipio</label>
              <select
                value={filtroMunicipio}
                onChange={(e) => { setFiltroMunicipio(e.target.value); setPaginaActual(1); }}
              >
                {municipiosOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
          </>
        }
        onLimpiarFiltros={limpiarFiltros}
        onAplicarFiltros={() => { setPaginaActual(1); cargarCitas(); }}

        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        registrosPorPagina={REGISTROS_POR_PAGINA}

        seccionesExtra={
          citas.length > 0 ? (
            <>
              <div className="card-simple">
                <SectionHeader
                  titulo="Resumen por estado"
                  descripcion="Distribución de citas por estado"
                  icono={CheckCircle2}
                />
                <div className="estados-grid">
                  {estadosResumen.map(([nombre, valor]) => {
                    const key = nombre.toLowerCase();
                    let colorClass = "gris";
                    let Icono = CalendarDays;

                    if (key.includes("atend")) { colorClass = "verde"; Icono = CheckCircle2; }
                    else if (key.includes("espera")) { colorClass = "naranja"; Icono = Clock3; }
                    else if (key.includes("present")) { colorClass = "rojo"; Icono = XCircle; }
                    else if (key.includes("contest")) { colorClass = "naranja"; Icono = AlertCircle; }
                    else if (key.includes("cancel")) { colorClass = "gris"; Icono = XCircle; }

                    return (
                      <div className={`estado-card estado-card--${colorClass}`} key={nombre}>
                        <div className="estado-card-icono"><Icono size={20} /></div>
                        <div className="estado-card-info">
                          <p className="estado-card-nombre">{nombre}</p>
                          <p className="estado-card-valor">
                            {valor.toLocaleString("es-MX")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card-simple">
                <SectionHeader
                  titulo="Próximas citas"
                  descripcion="Citas encontradas en el rango seleccionado."
                  icono={Clock3}
                />
                <div className="lista-proximas">
                  {proximasCitas.map((cita, index) => (
                    <div className="item-proxima" key={cita.id || index}>
                      <div className="fecha-proxima">
                        <CalendarDays size={18} />
                        <div>
                          <strong>{formatearFecha(cita.fecha)}</strong>
                          {cita.hora && <span>{formatearHora(cita.hora)}</span>}
                        </div>
                      </div>
                      <div className="info-proxima">
                        <strong>{cita.nombre || "Sin nombre"}</strong>
                        <span>{cita.tipo || "Cita"}</span>
                      </div>
                      <EstadoBadge estado={cita.estado || "Sin estatus"} />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null
        }
      />

      {citaSeleccionada && (
        <div
          className="citas-modal-overlay"
          onClick={() => setCitaSeleccionada(null)}
        >
          <div className="citas-modal" onClick={(e) => e.stopPropagation()}>
            <div className="citas-modal-header">
              <div className="citas-modal-header-info">
                <div className="citas-modal-icon"><CalendarDays size={20} /></div>
                <div>
                  <h2>Detalle de la cita</h2>
                  <p>Folio #{citaSeleccionada.id || "-"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCitaSeleccionada(null)}
                className="citas-modal-close"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="citas-modal-grid">
              <div><p>Buscador</p><strong>{citaSeleccionada.nombre || "-"}</strong></div>
              <div><p>CURP</p><strong>{citaSeleccionada.curp || "-"}</strong></div>
              <div><p>Fecha</p><strong>{formatearFecha(citaSeleccionada.fecha)}</strong></div>
              <div><p>Hora</p><strong>{formatearHora(citaSeleccionada.hora)}</strong></div>
              <div><p>Tipo de cita</p><strong>{citaSeleccionada.tipo || "-"}</strong></div>
              <div><p>Estado</p><EstadoBadge estado={citaSeleccionada.estado || "Sin estatus"} /></div>
              <div><p>Municipio</p><strong>{citaSeleccionada.municipio || "-"}</strong></div>
              <div><p>Consejero</p><strong>{citaSeleccionada.consejero || "-"}</strong></div>
            </div>

            <div className="citas-modal-footer">
              <button
                type="button"
                onClick={() => setCitaSeleccionada(null)}
                className="btn-modal-cerrar"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}