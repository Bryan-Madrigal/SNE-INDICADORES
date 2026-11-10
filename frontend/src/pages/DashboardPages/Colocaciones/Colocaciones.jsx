import React, { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Users,
  Building2,
  BriefcaseBusiness,
  CalendarDays,
  Eye,
  UserRound,
  MapPin,
  BarChart3,
  Award,
  XCircle,
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

import "./Colocaciones.css";

// =========================================================
// HELPERS
// =========================================================
const formatearFecha = (fecha) => {
  if (!fecha) return "-";
  const fechaObj = new Date(fecha);
  if (Number.isNaN(fechaObj.getTime())) return fecha;
  return fechaObj.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatearSalario = (salario) => {
  const numero = Number(salario);
  if (!numero || Number.isNaN(numero)) return "-";
  return `$${numero.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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
export default function Colocaciones() {
  // =======================================================
  // ESTADOS
  // =======================================================
  const [colocaciones, setColocaciones] = useState([]);
  const [indicadoresBD, setIndicadoresBD] = useState({
    vinculaciones: 0,
    colocaciones: 0,
    colocadosVacantes: 0,
    totalVacantes: 0,
  });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [colocacionSeleccionada, setColocacionSeleccionada] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [filtroMunicipio, setFiltroMunicipio] = useState("Todos");
  const [filtroEmpresa, setFiltroEmpresa] = useState("Todos");
  const [filtroPuesto, setFiltroPuesto] = useState("Todos");
  const [filtroUnidad, setFiltroUnidad] = useState("Todos");

  // Fechas (mes actual por defecto)
  const [fechaInicial, setFechaInicial] = useState(obtenerPrimerDiaMes());
  const [fechaFinal, setFechaFinal] = useState(obtenerUltimoDiaMes());
  const [periodo, setPeriodo] = useState("mensual");

  // Opciones para selects
  const [empresasOptions, setEmpresasOptions] = useState(["Todos"]);
  const [municipiosOptions, setMunicipiosOptions] = useState(["Todos"]);
  const [puestosOptions, setPuestosOptions] = useState(["Todos"]);
  const [unidadesOptions, setUnidadesOptions] = useState(["Todos"]);

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);

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
  // CARGAR COLOCACIONES
  // =======================================================
  const cargarColocaciones = async () => {
    try {
      setCargando(true);
      setError("");

      const params = new URLSearchParams();

      if (fechaInicial && fechaFinal) {
        params.append("fechaInicio", fechaInicial);
        params.append("fechaFin", fechaFinal);
      }

      if (filtroMunicipio && filtroMunicipio !== "Todos") params.append("municipio", filtroMunicipio);
      if (filtroEmpresa && filtroEmpresa !== "Todos") params.append("empresa", filtroEmpresa);
      if (filtroPuesto && filtroPuesto !== "Todos") params.append("puesto", filtroPuesto);
      if (filtroUnidad && filtroUnidad !== "Todos") params.append("unidad", filtroUnidad);
      if (busqueda.trim()) params.append("busqueda", busqueda.trim());

      const url = `/colocaciones${params.toString() ? `?${params.toString()}` : ""}`;
      const response = await api.get(url);

      if (response.data?.success) {
        const data = response.data?.data || {};
        const colocacionesList = Array.isArray(data.colocaciones) ? data.colocaciones : [];
        const indicadores = data.indicadores || {};

        setColocaciones(colocacionesList);
        setIndicadoresBD({
          vinculaciones: Number(indicadores.vinculaciones) || 0,
          colocaciones: Number(indicadores.colocaciones) || 0,
          colocadosVacantes: Number(indicadores.colocadosVacantes) || 0,
          totalVacantes: Number(indicadores.totalVacantes) || 0,
        });

        setEmpresasOptions(data.empresas || ["Todos"]);
        setMunicipiosOptions(data.municipios || ["Todos"]);
        setPuestosOptions(data.puestos || ["Todos"]);
        setUnidadesOptions(data.unidades || ["Todos"]);

        setPaginaActual(1);
      } else {
        setColocaciones([]);
        setError(response.data?.message || "La respuesta del servidor no fue exitosa.");
      }
    } catch (err) {
      console.error("Error al cargar colocaciones:", err);
      const mensajeError =
        err.response?.data?.error ||
        err.response?.data?.message ||
        err.message ||
        "Error desconocido";
      setError(`Error al cargar colocaciones: ${mensajeError}`);
      setColocaciones([]);
    } finally {
      setCargando(false);
    }
  };

  // =======================================================
  // CARGAR AL ENTRAR Y CUANDO CAMBIAN FILTROS
  // =======================================================
  useEffect(() => {
    cargarColocaciones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicial, fechaFinal, filtroMunicipio, filtroEmpresa, filtroPuesto, filtroUnidad, busqueda]);

  // =======================================================
  // LIMPIAR FILTROS
  // =======================================================
  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltroMunicipio("Todos");
    setFiltroEmpresa("Todos");
    setFiltroPuesto("Todos");
    setFiltroUnidad("Todos");
    setPeriodo("mensual");
    setFechaInicial(obtenerPrimerDiaMes());
    setFechaFinal(obtenerUltimoDiaMes());
    setPaginaActual(1);
  };

  // =======================================================
  // ESTADÍSTICAS
  // =======================================================
  const estadisticas = useMemo(() => {
    const empresasUnicas = new Set(colocaciones.map(c => c.empresa).filter(Boolean)).size;

    const salarios = colocaciones.map(c => Number(c.salario)).filter(s => !Number.isNaN(s) && s > 0);
    const salarioPromedio = salarios.length > 0
      ? salarios.reduce((a, b) => a + b, 0) / salarios.length
      : 0;

    const puestosConteo = {};
    colocaciones.forEach(c => {
      if (c.puesto) {
        puestosConteo[c.puesto] = (puestosConteo[c.puesto] || 0) + 1;
      }
    });
    const puestosMasColocados = Object.entries(puestosConteo).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const empresasConteo = {};
    colocaciones.forEach(c => {
      if (c.empresa) {
        empresasConteo[c.empresa] = (empresasConteo[c.empresa] || 0) + 1;
      }
    });
    const empresasMasColocaciones = Object.entries(empresasConteo).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const municipiosConteo = {};
    colocaciones.forEach(c => {
      if (c.municipio) {
        municipiosConteo[c.municipio] = (municipiosConteo[c.municipio] || 0) + 1;
      }
    });
    const municipioMayor = Object.entries(municipiosConteo).sort((a, b) => b[1] - a[1])[0]?.[0] || "Sin datos";

    return {
      totalColocaciones: indicadoresBD.colocaciones,
      colocacionesMes: indicadoresBD.colocaciones,
      vinculaciones: indicadoresBD.vinculaciones,
      personasColocadas: new Set(colocaciones.map(c => c.curp).filter(Boolean)).size,
      empresasContratantes: empresasUnicas,
      puestoMasColocado: puestosMasColocados[0]?.[0] || "Sin datos",
      salarioPromedio,
      municipioMayorColocacion: municipioMayor,
      puestosMasColocados,
      empresasMasColocaciones,
    };
  }, [colocaciones, indicadoresBD]);

  // =======================================================
  // KPIs (3)
  // =======================================================
  const indicadores = [
    {
      id: "total-colocaciones",
      titulo: "Total de Colocaciones",
      valor: estadisticas.totalColocaciones,
      descripcion: "Registros encontrados",
      icono: BadgeCheck,
      color: "green",
    },
    {
      id: "personas-colocadas",
      titulo: "Personas Colocadas",
      valor: estadisticas.personasColocadas,
      descripcion: "Personas únicas",
      icono: Users,
      color: "purple",
    },
    {
      id: "empresas-contratantes",
      titulo: "Empresas Contratantes",
      valor: estadisticas.empresasContratantes,
      descripcion: "Empresas participantes",
      icono: Building2,
      color: "orange",
    },
  ];

  // =======================================================
  // COLUMNAS (sin consejero)
  // =======================================================
  const columnas = [
    { key: "fechaColocacion", label: "Fecha" },
    { key: "persona", label: "Persona Colocada" },
    { key: "puesto", label: "Puesto" },
    { key: "empresa", label: "Empresa" },
    { key: "municipio", label: "Municipio" },
    { key: "salario", label: "Salario" },
    { key: "estado", label: "Estatus" },
    { key: "accion", label: "Acción" },
  ];

  // =======================================================
  // RENDER CELDA
  // =======================================================
  const renderCelda = (colocacion, columna) => {
    switch (columna) {
      case "fechaColocacion":
        return (
          <div className="celda-principal">
            <strong>{formatearFecha(colocacion.fechaColocacion)}</strong>
            <small>Folio {colocacion.folio || "-"}</small>
          </div>
        );

      case "persona":
        return (
          <div className="celda-avatar">
            <div className="celda-avatar-icono purple">
              <UserRound size={15} />
            </div>
            <div className="celda-principal">
              <strong>{colocacion.nombre || "-"}</strong>
              <small>{colocacion.curp || "-"}</small>
            </div>
          </div>
        );

      case "puesto":
        return (
          <div className="celda-icono">
            <BriefcaseBusiness size={15} />
            {colocacion.puesto || "-"}
          </div>
        );

      case "empresa":
        return (
          <div className="celda-icono">
            <Building2 size={15} />
            {colocacion.empresa || "-"}
          </div>
        );

      case "municipio":
        return (
          <div className="celda-icono">
            <MapPin size={15} />
            {colocacion.municipio || "-"}
          </div>
        );

      case "salario":
        return (
          <span className="numero-green">
            {formatearSalario(colocacion.salario)}
          </span>
        );

      case "estado":
        return <span className="badge-estatus">Colocado</span>;

      case "accion":
        return (
          <button
            type="button"
            className="btn-ver"
            onClick={() => setColocacionSeleccionada(colocacion)}
            title="Ver detalle"
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
        // CABECERA
        titulo="Colocaciones"
        descripcion="Consulta y analiza los resultados de las personas buscadoras de empleo que lograron incorporarse al mercado laboral."
        icono={BadgeCheck}

        // DATOS
        datos={colocaciones}
        cargando={cargando}
        error={error}
        onRecargar={cargarColocaciones}

        // KPIs
        indicadores={indicadores}

        // TABLA
        columnas={columnas}
        renderCelda={renderCelda}
        filaKey={(c, index) => c.id || index}
        mensajeVacio="No hay colocaciones que coincidan con los filtros."

        // FECHAS
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
          cargarColocaciones();
        }}

        // BÚSQUEDA Y FILTROS
        busqueda={busqueda}
        onBusqueda={setBusqueda}
        filtrosPersonalizados={
          <>
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
              <label>Unidad</label>
              <select
                value={filtroUnidad}
                onChange={(e) => {
                  setFiltroUnidad(e.target.value);
                  setPaginaActual(1);
                }}
              >
                {unidadesOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </>
        }
        onLimpiarFiltros={limpiarFiltros}
        onAplicarFiltros={() => {
          setPaginaActual(1);
          cargarColocaciones();
        }}

        // PAGINACIÓN
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        registrosPorPagina={REGISTROS_POR_PAGINA}

        // SECCIONES EXTRA
        seccionesExtra={
          <>
            {/* Efectividad + Resumen */}
            <div className="dashboard-grid-2">
              <div className="card-simple">
                <SectionHeader
                  titulo="Efectividad del proceso"
                  descripcion="Comparativa entre personas vinculadas y colocadas."
                  icono={BarChart3}
                />
                <div className="col-efectividad">
                  <div className="col-efectividad-box blue">
                    <Users size={25} />
                    <p>Vinculaciones</p>
                    <strong>
                      {Number(estadisticas.vinculaciones).toLocaleString("es-MX")}
                    </strong>
                  </div>
                  <div className="col-efectividad-box green">
                    <BadgeCheck size={25} />
                    <p>Colocaciones</p>
                    <strong>
                      {Number(estadisticas.totalColocaciones).toLocaleString("es-MX")}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="card-simple">
                <SectionHeader
                  titulo="Resumen de resultados"
                  descripcion="Principales resultados obtenidos durante el periodo."
                  icono={Award}
                />
                <div className="col-resumen">
                  <div>
                    <span>Puesto con mayor colocación</span>
                    <strong>{estadisticas.puestoMasColocado}</strong>
                  </div>
                  <div>
                    <span>Municipio con mayor colocación</span>
                    <strong>{estadisticas.municipioMayorColocacion}</strong>
                  </div>
                  <div>
                    <span>Salario promedio</span>
                    <strong className="blue-text">
                      {formatearSalario(estadisticas.salarioPromedio)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Puestos + Empresas */}
            <div className="dashboard-grid-2">
              <div className="card-simple">
                <SectionHeader
                  titulo="Puestos con más colocaciones"
                  icono={BriefcaseBusiness}
                />
                <div className="lista-barras">
                  {estadisticas.puestosMasColocados.map(([nombre, valor]) => {
                    const maximo = estadisticas.puestosMasColocados[0]?.[1] || 1;
                    return (
                      <div key={nombre} className="barra-item">
                        <div className="barra-item-header">
                          <span>{nombre}</span>
                          <strong>{valor}</strong>
                        </div>
                        <div className="barra-fondo">
                          <div
                            className="barra-progreso"
                            style={{
                              width: `${Math.min((valor / maximo) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="card-simple">
                <SectionHeader
                  titulo="Empresas con más colocaciones"
                  icono={Building2}
                />
                <div className="lista-barras">
                  {estadisticas.empresasMasColocaciones.map(([nombre, valor]) => {
                    const maximo = estadisticas.empresasMasColocaciones[0]?.[1] || 1;
                    return (
                      <div key={nombre} className="barra-item">
                        <div className="barra-item-header">
                          <span>{nombre}</span>
                          <strong>{valor}</strong>
                        </div>
                        <div className="barra-fondo">
                          <div
                            className="barra-progreso barra-progreso-orange"
                            style={{
                              width: `${Math.min((valor / maximo) * 100, 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </>
        }
      />

      {/* =================================================
          MODAL DE COLOCACIÓN
      ================================================= */}
      {colocacionSeleccionada && (
        <div
          className="colocaciones-modal-overlay"
          onClick={() => setColocacionSeleccionada(null)}
        >
          <div
            className="colocaciones-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="colocaciones-modal-header">
              <div className="colocaciones-modal-header-info">
                <div className="colocaciones-modal-icon">
                  <BadgeCheck size={20} />
                </div>
                <div>
                  <h2>Detalle de colocación</h2>
                  <p>Folio #{colocacionSeleccionada.folio || "-"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setColocacionSeleccionada(null)}
                className="colocaciones-modal-close"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* BODY */}
            <div className="colocaciones-modal-grid">
              <div>
                <p>Nombre completo</p>
                <strong>{colocacionSeleccionada.nombre || "-"}</strong>
              </div>

              <div>
                <p>CURP</p>
                <strong>{colocacionSeleccionada.curp || "-"}</strong>
              </div>

              <div>
                <p>Fecha de colocación</p>
                <strong>{formatearFecha(colocacionSeleccionada.fechaColocacion)}</strong>
              </div>

              <div>
                <p>Fecha de envío</p>
                <strong>{formatearFecha(colocacionSeleccionada.fechaEnvio)}</strong>
              </div>

              <div>
                <p>Puesto</p>
                <strong>{colocacionSeleccionada.puesto || "-"}</strong>
              </div>

              <div>
                <p>Empresa</p>
                <strong>{colocacionSeleccionada.empresa || "-"}</strong>
              </div>

              <div>
                <p>Municipio</p>
                <strong>{colocacionSeleccionada.municipio || "-"}</strong>
              </div>

              <div>
                <p>Salario</p>
                <strong className="numero-green">
                  {formatearSalario(colocacionSeleccionada.salario)}
                </strong>
              </div>

              <div>
                <p>Unidad</p>
                <strong>{colocacionSeleccionada.unidad || "-"}</strong>
              </div>

              <div>
                <p>Edad</p>
                <strong>{colocacionSeleccionada.edad || "-"}</strong>
              </div>

              <div>
                <p>Estado</p>
                <span className="badge-estatus">Colocado</span>
              </div>
            </div>

            {/* FOOTER */}
            <div className="colocaciones-modal-footer">
              <button
                type="button"
                onClick={() => setColocacionSeleccionada(null)}
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
