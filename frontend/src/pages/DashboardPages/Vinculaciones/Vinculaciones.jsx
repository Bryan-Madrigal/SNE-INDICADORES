import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Users,
  UserRound,
  BriefcaseBusiness,
  MapPin,
  Link2,
  TrendingUp,
  CalendarDays,
  Eye,
  Clock3,
  XCircle,
  BarChart3,
  Building2,
} from "lucide-react";

// =========================================================
// COMPONENTES COMUNES
// =========================================================
import CommonModule from "../../../components/common/CommonModule";
import EstadoBadge from "../../../components/common/EstadoBadge";
import SectionHeader from "../../../components/common/SectionHeader";

// =========================================================
// API
// =========================================================
import api from "../../../services/api";

import "./Vinculaciones.css";

// =========================================================
// HELPERS
// =========================================================
const formatearFecha = (fecha) => {
  if (!fecha) return "-";
  const fechaObj = new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) return String(fecha);
  return fechaObj.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const obtenerPrimerDiaMes = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
};

const obtenerUltimoDiaMes = () => {
  const hoy = new Date();
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
};

const REGISTROS_POR_PAGINA = 10;

// =========================================================
// COMPONENTE PRINCIPAL
// =========================================================
export default function Vinculaciones() {
  const [vinculaciones, setVinculaciones] = useState([]);
  const [conteos, setConteos] = useState({
    total: 0,
    canceladas: 0,
    enEspera: 0,
    noSePresento: 0,
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [vinculacionSeleccionada, setVinculacionSeleccionada] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroEmpresa, setFiltroEmpresa] = useState("Todos");
  const [filtroMunicipio, setFiltroMunicipio] = useState("Todos");
  const [filtroPuesto, setFiltroPuesto] = useState("Todos");
  const [filtroConsejero, setFiltroConsejero] = useState("Todos");

  const location = useLocation();
  const statePeriodo = location.state?.periodo;
  const stateInicio = location.state?.inicio;
  const stateFin = location.state?.fin;

  // Fechas
  const [fechaInicial, setFechaInicial] = useState(() => {
    if (statePeriodo === "todos") return "";
    if (statePeriodo === "personalizado" && stateInicio) return stateInicio;
    return obtenerPrimerDiaMes();
  });
  const [fechaFinal, setFechaFinal] = useState(() => {
    if (statePeriodo === "todos") return "";
    if (statePeriodo === "personalizado" && stateFin) return stateFin;
    return obtenerUltimoDiaMes();
  });
  const [periodo, setPeriodo] = useState(() => statePeriodo || "mensual");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);

  // Opciones
  const [empresasOptions, setEmpresasOptions] = useState(["Todos"]);
  const [municipiosOptions, setMunicipiosOptions] = useState(["Todos"]);
  const [puestosOptions, setPuestosOptions] = useState(["Todos"]);
  const [consejerosOptions, setConsejerosOptions] = useState(["Todos"]);

  // =======================================================
  // ACTUALIZAR FECHAS SEGÚN PERÍODO
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
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
        break;
      case "anual":
        inicio = new Date(hoy.getFullYear(), 0, 1);
        fin = new Date(hoy.getFullYear(), 11, 31);
        break;
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
  // CARGAR VINCULACIONES
  // =======================================================
  const cargarVinculaciones = async () => {
    try {
      setCargando(true);
      setError("");

      const params = new URLSearchParams();

      if (fechaInicial && fechaFinal) {
        params.append("fechaInicio", fechaInicial);
        params.append("fechaFin", fechaFinal);
      }

      if (filtroEmpresa && filtroEmpresa !== "Todos") params.append("empresa", filtroEmpresa);
      if (filtroMunicipio && filtroMunicipio !== "Todos") params.append("municipio", filtroMunicipio);
      if (filtroPuesto && filtroPuesto !== "Todos") params.append("puesto", filtroPuesto);
      if (filtroConsejero && filtroConsejero !== "Todos") params.append("consejero", filtroConsejero);
      if (busqueda.trim()) params.append("busqueda", busqueda.trim());

      const url = `/vinculaciones${params.toString() ? `?${params.toString()}` : ""}`;
      const respuesta = await api.get(url);

      if (respuesta.data?.success) {
        const data = respuesta.data?.data || {};
        const lista = Array.isArray(data.vinculaciones) ? data.vinculaciones : [];

        setVinculaciones(lista);
        setConteos(data.conteos || {
          total: 0,
          canceladas: 0,
          enEspera: 0,
          noSePresento: 0,
        });
        setEmpresasOptions(data.empresas || ["Todos"]);
        setMunicipiosOptions(data.municipios || ["Todos"]);
        setPuestosOptions(data.puestos || ["Todos"]);
        setConsejerosOptions(data.consejeros || ["Todos"]);
        setPaginaActual(1);
      } else {
        setVinculaciones([]);
        setError(respuesta.data?.mensaje || "No se pudieron cargar las vinculaciones.");
      }
    } catch (err) {
      console.error("Error al cargar vinculaciones:", err);
      setVinculaciones([]);
      setError(err.response?.data?.mensaje || "No se pudieron cargar las vinculaciones.");
    } finally {
      setCargando(false);
    }
  };

  // =======================================================
  // CARGAR AL ENTRAR
  // =======================================================
  useEffect(() => {
    cargarVinculaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicial, fechaFinal, filtroEmpresa, filtroMunicipio, filtroPuesto, filtroConsejero, busqueda]);

  // =======================================================
  // LIMPIAR FILTROS
  // =======================================================
  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroEmpresa("Todos");
    setFiltroMunicipio("Todos");
    setFiltroPuesto("Todos");
    setFiltroConsejero("Todos");
    setPeriodo("mensual");
    setFechaInicial(obtenerPrimerDiaMes());
    setFechaFinal(obtenerUltimoDiaMes());
    setPaginaActual(1);
  };

  // =======================================================
  // KPIs (4 tarjetas)
  // =======================================================
  const indicadores = [
    {
      id: "total",
      titulo: "Total Vinculaciones",
      valor: conteos.total,
      descripcion: "Vinculaciones en el periodo",
      icono: Link2,
      color: "blue",
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
      id: "canceladas",
      titulo: "Canceladas",
      valor: conteos.canceladas,
      descripcion: "Canceladas en el periodo",
      icono: XCircle,
      color: "purple",
    },
  ];

  // =======================================================
  // RESÚMENES
  // =======================================================
  const empresasResumen = useMemo(() => {
    const conteo = {};
    vinculaciones.forEach((v) => {
      const empresa = v.empresa || "Sin empresa";
      conteo[empresa] = (conteo[empresa] || 0) + 1;
    });
    return Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [vinculaciones]);

  const consejerosResumen = useMemo(() => {
    const conteo = {};
    vinculaciones.forEach((v) => {
      const consejero = v.consejero || "Sin consejero";
      conteo[consejero] = (conteo[consejero] || 0) + 1;
    });
    return Object.entries(conteo).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [vinculaciones]);

  const estadosResumen = useMemo(() => {
    const resumen = [];
    if (conteos.enEspera > 0) resumen.push(["En Espera", conteos.enEspera]);
    if (conteos.noSePresento > 0) resumen.push(["No se presentó", conteos.noSePresento]);
    if (conteos.canceladas > 0) resumen.push(["Canceladas", conteos.canceladas]);
    if (conteos.total > 0) resumen.push(["Atendidas", conteos.total]);
    return resumen.sort((a, b) => b[1] - a[1]);
  }, [conteos]);

  // =======================================================
  // COLUMNAS
  // =======================================================
  const columnas = [
    { key: "fecha", label: "Fecha" },
    { key: "buscador", label: "Buscador" },
    { key: "empresa", label: "Empresa" },
    { key: "puesto", label: "Puesto" },
    { key: "municipio", label: "Municipio" },
    { key: "consejero", label: "Consejero" },
    { key: "estado", label: "Estado" },
    { key: "accion", label: "Acción" },
  ];

  const renderCelda = (vinculacion, claveColumna) => {
    switch (claveColumna) {
      case "fecha":
        return (
          <div className="celda-principal">
            <strong>{formatearFecha(vinculacion.fecha)}</strong>
            <small>Folio {vinculacion.id || "-"}</small>
          </div>
        );

      case "buscador":
        return (
          <div className="celda-avatar">
            <div className="celda-avatar-icono purple">
              <UserRound size={15} />
            </div>
            <div className="celda-principal">
              <strong>{vinculacion.nombre || "Sin nombre"}</strong>
              <small>{vinculacion.curp || "-"}</small>
            </div>
          </div>
        );

      case "empresa":
        return (
          <div className="celda-avatar">
            <div className="celda-avatar-icono orange">
              <Building2 size={15} />
            </div>
            <span>{vinculacion.empresa || "Sin empresa"}</span>
          </div>
        );

      case "puesto":
        return (
          <div className="celda-icono">
            <BriefcaseBusiness size={15} />
            {vinculacion.puesto || "Sin puesto"}
          </div>
        );

      case "municipio":
        return (
          <div className="celda-icono">
            <MapPin size={15} />
            {vinculacion.municipio || "Sin municipio"}
          </div>
        );

      case "consejero":
        return <span>{vinculacion.consejero || "Sin consejero"}</span>;

      case "estado":
        return <EstadoBadge estado={vinculacion.estado || "Atendida"} />;

      case "accion":
        return (
          <button
            type="button"
            title="Ver detalle"
            onClick={() => setVinculacionSeleccionada(vinculacion)}
            className="btn-ver"
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
        titulo="Vinculaciones"
        descripcion="Consulta y analiza las personas buscadoras vinculadas con empresas y oportunidades laborales."
        icono={Link2}

        datos={vinculaciones}
        cargando={cargando}
        error={error}
        onRecargar={cargarVinculaciones}

        indicadores={indicadores}

        columnas={columnas}
        renderCelda={renderCelda}
        filaKey={(fila, index) => fila.id ?? index}
        mensajeVacio="No hay vinculaciones que coincidan con los filtros."

        fechaInicial={fechaInicial}
        setFechaInicial={(v) => {
          setFechaInicial(v);
          setPeriodo("personalizado");
        }}
        fechaFinal={fechaFinal}
        setFechaFinal={(v) => {
          setFechaFinal(v);
          setPeriodo("personalizado");
        }}
        periodo={periodo}
        setPeriodo={(v) => {
          if (v === "personalizado") {
            setPeriodo(v);
          } else {
            actualizarFechasPorPeriodo(v);
          }
        }}
        onConsultarFechas={() => {
          setPaginaActual(1);
          cargarVinculaciones();
        }}

        busqueda={busqueda}
        onBusqueda={setBusqueda}
        filtrosPersonalizados={
          <>
            <div>
              <label>Empresa</label>
              <select
                value={filtroEmpresa}
                onChange={(e) => {
                  setFiltroEmpresa(e.target.value);
                  setPaginaActual(1);
                }}
              >
                {empresasOptions.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Municipio</label>
              <select
                value={filtroMunicipio}
                onChange={(e) => {
                  setFiltroMunicipio(e.target.value);
                  setPaginaActual(1);
                }}
              >
                {municipiosOptions.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Puesto</label>
              <select
                value={filtroPuesto}
                onChange={(e) => {
                  setFiltroPuesto(e.target.value);
                  setPaginaActual(1);
                }}
              >
                {puestosOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Consejero</label>
              <select
                value={filtroConsejero}
                onChange={(e) => {
                  setFiltroConsejero(e.target.value);
                  setPaginaActual(1);
                }}
              >
                {consejerosOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </>
        }
        onLimpiarFiltros={limpiarFiltros}
        onAplicarFiltros={() => {
          setPaginaActual(1);
          cargarVinculaciones();
        }}

        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        registrosPorPagina={REGISTROS_POR_PAGINA}

        seccionesExtra={
          <>
            {/* Estado + Empresas + Consejeros */}
            <div className="dashboard-grid-3">
              <div className="card-simple">
                <SectionHeader titulo="Estado de vinculaciones" icono={BarChart3} />
                <div className="lista-barras">
                  {estadosResumen.length === 0 ? (
                    <p className="texto-secundario">No hay información disponible.</p>
                  ) : (
                    estadosResumen.map(([nombre, valor]) => {
                      const maximo = estadosResumen[0]?.[1] || 1;
                      return (
                        <div key={nombre} className="barra-item">
                          <div className="barra-item-header">
                            <span>{nombre}</span>
                            <strong>{valor}</strong>
                          </div>
                          <div className="barra-fondo">
                            <div
                              className="barra-progreso"
                              style={{ width: `${(valor / maximo) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="card-simple">
                <SectionHeader titulo="Empresas con más vinculaciones" icono={Building2} />
                <div className="lista-barras">
                  {empresasResumen.length === 0 ? (
                    <p className="texto-secundario">No hay información disponible.</p>
                  ) : (
                    empresasResumen.map(([nombre, valor]) => (
                      <div key={nombre} className="empresa-resumen">
                        <span>{nombre}</span>
                        <strong>{valor}</strong>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="card-simple">
                <SectionHeader
                  titulo="Vinculaciones por consejero"
                  descripcion="Número de vinculaciones gestionadas."
                  icono={Users}
                />
                <div className="lista-barras">
                  {consejerosResumen.length === 0 ? (
                    <p className="texto-secundario">No hay información de consejeros.</p>
                  ) : (
                    consejerosResumen.map(([nombre, valor]) => {
                      const maximo = consejerosResumen[0]?.[1] || 1;
                      return (
                        <div key={nombre} className="barra-item">
                          <div className="barra-item-header">
                            <span>{nombre}</span>
                            <strong>{valor}</strong>
                          </div>
                          <div className="barra-fondo">
                            <div
                              className="barra-progreso barra-progreso-morado"
                              style={{ width: `${(valor / maximo) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </>
        }
      />

      {/* MODAL DE VINCULACIÓN */}
      {vinculacionSeleccionada && (
        <div
          className="vinculaciones-modal-overlay"
          onClick={() => setVinculacionSeleccionada(null)}
        >
          <div
            className="vinculaciones-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="vinculaciones-modal-header">
              <div className="vinculaciones-modal-header-info">
                <div className="vinculaciones-modal-icon">
                  <Link2 size={20} />
                </div>
                <div>
                  <h2>Detalle de la vinculación</h2>
                  <p>Folio #{vinculacionSeleccionada.id || "-"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVinculacionSeleccionada(null)}
                className="vinculaciones-modal-close"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="vinculaciones-modal-grid">
              <div>
                <p>Fecha</p>
                <strong>{formatearFecha(vinculacionSeleccionada.fecha)}</strong>
              </div>
              <div>
                <p>Buscador</p>
                <strong>{vinculacionSeleccionada.nombre || "-"}</strong>
              </div>
              <div>
                <p>CURP</p>
                <strong>{vinculacionSeleccionada.curp || "-"}</strong>
              </div>
              <div>
                <p>Empresa</p>
                <strong>{vinculacionSeleccionada.empresa || "-"}</strong>
              </div>
              <div>
                <p>Puesto</p>
                <strong>{vinculacionSeleccionada.puesto || "-"}</strong>
              </div>
              <div>
                <p>Municipio</p>
                <strong>{vinculacionSeleccionada.municipio || "-"}</strong>
              </div>
              <div>
                <p>Consejero</p>
                <strong>{vinculacionSeleccionada.consejero || "-"}</strong>
              </div>
              <div>
                <p>Estado</p>
                <EstadoBadge estado={vinculacionSeleccionada.estado || "Atendida"} />
              </div>
              <div>
                <p>Resultado</p>
                <strong>{vinculacionSeleccionada.resultado || "-"}</strong>
              </div>
            </div>

            <div className="vinculaciones-modal-footer">
              <button
                type="button"
                onClick={() => setVinculacionSeleccionada(null)}
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