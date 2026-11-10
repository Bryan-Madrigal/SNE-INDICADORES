import React, { useEffect, useMemo, useState } from "react";
import {
  Users,
  UserRound,
  MapPin,
  GraduationCap,
  Eye,
  UserCheck,
  UserPlus,
  CircleCheck,
  XCircle,
  CalendarDays,
} from "lucide-react";

import CommonModule from "../../../components/common/CommonModule";
import EstadoBadge from "../../../components/common/EstadoBadge";
import SectionHeader from "../../../components/common/SectionHeader";
import api from "../../../services/api";

import "./BuscadoresEmpleo.css";

// =========================================================
// HELPERS
// =========================================================
const obtenerPrimerDiaMes = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
};

const obtenerUltimoDiaMes = () => {
  const hoy = new Date();
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
};

const formatearFecha = (fecha) => {
  if (!fecha) return "-";
  try {
    const fechaObj = new Date(fecha);
    if (isNaN(fechaObj.getTime())) return "-";
    return fechaObj.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "-";
  }
};

const REGISTROS_POR_PAGINA = 10;

// =========================================================
// COMPONENTE
// =========================================================
export default function BuscadoresEmpleo() {
  const [buscadorSeleccionado, setBuscadorSeleccionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [buscadores, setBuscadores] = useState([]);
  const [indicadores, setIndicadores] = useState({
    totalBuscadores: 0,
    trabajadores: 0,
    noTrabajadores: 0,
    noEspecificados: 0,
  });
  const [escolaridadData, setEscolaridadData] = useState([]);
  const [situacionData, setSituacionData] = useState([]);
  const [estadoData, setEstadoData] = useState([]);

  const [busqueda, setBusqueda] = useState("");
  const [municipio, setMunicipio] = useState("Todos");
  const [escolaridad, setEscolaridad] = useState("Todas");

  const [fechaInicial, setFechaInicial] = useState(obtenerPrimerDiaMes());
  const [fechaFinal, setFechaFinal] = useState(obtenerUltimoDiaMes());
  const [periodo, setPeriodo] = useState("mensual");

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
  // CARGAR BUSCADORES
  // =======================================================
  const cargarBuscadores = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No existe un token de sesión. Inicia sesión nuevamente.");
      }

      const params = new URLSearchParams();

      if (fechaInicial && fechaFinal) {
        params.append("fechaInicio", fechaInicial);
        params.append("fechaFin", fechaFinal);
      }

      if (municipio && municipio !== "Todos") params.append("municipio", municipio);
      if (escolaridad && escolaridad !== "Todas") params.append("escolaridad", escolaridad);
      if (busqueda.trim()) params.append("busqueda", busqueda.trim());

      params.append("cveUnOperativa", "0");

      const url = `/buscadores${params.toString() ? `?${params.toString()}` : ""}`;

      console.log("========================================");
      console.log(">>> URL LLAMADA:", url);
      console.log(">>> FECHAS:", fechaInicial, "a", fechaFinal);
      console.log(">>> FILTROS:", { municipio, escolaridad, busqueda });
      console.log("========================================");

      const response = await api.get(url);
      const data = response.data?.data;

      if (!data) {
        throw new Error("La API no devolvió información de buscadores.");
      }

      console.log(">>> RESPUESTA BACKEND:");
      console.log("    buscadores.length =", data.buscadores?.length);
      console.log("    indicadores =", data.indicadores);
      console.log("========================================");

      setBuscadores(Array.isArray(data.buscadores) ? data.buscadores : []);
      setIndicadores(
        data.indicadores || {
          totalBuscadores: 0,
          trabajadores: 0,
          noTrabajadores: 0,
          noEspecificados: 0,
        }
      );
      setEscolaridadData(Array.isArray(data.escolaridadData) ? data.escolaridadData : []);
      setSituacionData(Array.isArray(data.situacionData) ? data.situacionData : []);
      setEstadoData(Array.isArray(data.estadoData) ? data.estadoData : []);

      setPaginaActual(1);
    } catch (err) {
      console.error("Error cargando buscadores:", err);
      setError(
        err.response?.data?.message ||
        err.message ||
        "No se pudieron cargar los buscadores."
      );
      setBuscadores([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarBuscadores();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicial, fechaFinal, municipio, escolaridad, busqueda]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setMunicipio("Todos");
    setEscolaridad("Todas");
    setPeriodo("mensual");
    setFechaInicial(obtenerPrimerDiaMes());
    setFechaFinal(obtenerUltimoDiaMes());
    setPaginaActual(1);
  };

  // =======================================================
  // OPCIONES DE FILTROS
  // =======================================================
  const municipiosList = useMemo(() => {
    return ["Todos", ...new Set(buscadores.map((b) => b.municipio).filter(Boolean))];
  }, [buscadores]);

  const escolaridadesList = useMemo(() => {
    return ["Todas", ...new Set(buscadores.map((b) => b.escolaridad).filter(Boolean))];
  }, [buscadores]);

  // =======================================================
  // KPIs
  // =======================================================
  const indicadoresConIconos = [
    {
      id: "total-buscadores",
      titulo: "Total buscadores",
      valor: indicadores.totalBuscadores,
      descripcion: "Personas registradas",
      icono: Users,
      color: "blue",
    },
    {
      id: "trabajan",
      titulo: "Trabajan",
      valor: indicadores.trabajadores,
      descripcion: "Con empleo actual",
      icono: UserPlus,
      color: "purple",
    },
    {
      id: "no-trabajan",
      titulo: "No trabajan",
      valor: indicadores.noTrabajadores,
      descripcion: "Sin empleo actual",
      icono: UserCheck,
      color: "green",
    },
    {
      id: "no-especificado",
      titulo: "No especificado",
      valor: indicadores.noEspecificados,
      descripcion: "Sin información",
      icono: CircleCheck,
      color: "cyan",
    },
  ];

  // =======================================================
  // COLUMNAS
  // =======================================================
  const columnas = [
    { key: "fechaRegistro", label: "Fecha de registro" },
    { key: "nombre", label: "Nombre" },
    { key: "curp", label: "CURP" },
    { key: "edad", label: "Edad" },
    { key: "genero", label: "Género" },
    { key: "municipio", label: "Municipio" },
    { key: "escolaridad", label: "Escolaridad" },
    { key: "accion", label: "Acción" },
  ];

  const renderCelda = (buscador, columna) => {
    switch (columna) {
      case "fechaRegistro":
        return (
          <div className="celda-principal">
            <strong>{formatearFecha(buscador.fechaRegistro)}</strong>
            <small>Registro</small>
          </div>
        );

      case "nombre":
        return (
          <div className="celda-avatar">
            <div className="celda-avatar-icono purple">
              <UserRound size={15} />
            </div>
            <div className="celda-principal">
              <strong>{buscador.nombre || "Sin nombre"}</strong>
              <small>{buscador.curp || "-"}</small>
            </div>
          </div>
        );

      case "curp":
        return <span>{buscador.curp || "-"}</span>;

      case "edad":
        return (
          <span className="numero-blue">
            {buscador.edad !== null && buscador.edad !== undefined ? buscador.edad : "-"}
          </span>
        );

      case "genero":
        return <span>{buscador.genero || "No especificado"}</span>;

      case "municipio":
        return (
          <div className="celda-icono">
            <MapPin size={15} />
            {buscador.municipio || "No especificado"}
          </div>
        );

      case "escolaridad":
        return (
          <div className="celda-icono">
            <GraduationCap size={15} />
            {buscador.escolaridad || "No especificado"}
          </div>
        );

      case "accion":
        return (
          <button
            type="button"
            onClick={() => setBuscadorSeleccionado(buscador)}
            className="btn-ver"
            title="Ver perfil"
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
        titulo="Buscadores de Empleo"
        descripcion="Perfil y situación de las personas en búsqueda de empleo."
        icono={Users}

        datos={buscadores}
        cargando={loading}
        error={error}
        onRecargar={cargarBuscadores}

        indicadores={indicadoresConIconos}

        columnas={columnas}
        renderCelda={renderCelda}
        filaKey={(b) => b.cveSolicitante || b.id}
        mensajeVacio="No hay buscadores que coincidan con los filtros."

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
          cargarBuscadores();
        }}

        busqueda={busqueda}
        onBusqueda={setBusqueda}
        filtrosPersonalizados={
          <>
            <div>
              <label>Municipio</label>
              <select
                value={municipio}
                onChange={(e) => {
                  setMunicipio(e.target.value);
                  setPaginaActual(1);
                }}
              >
                {municipiosList.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div>
              <label>Escolaridad</label>
              <select
                value={escolaridad}
                onChange={(e) => {
                  setEscolaridad(e.target.value);
                  setPaginaActual(1);
                }}
              >
                {escolaridadesList.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </>
        }
        onLimpiarFiltros={limpiarFiltros}
        onAplicarFiltros={() => {
          setPaginaActual(1);
          cargarBuscadores();
        }}

        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        registrosPorPagina={REGISTROS_POR_PAGINA}

        seccionesExtra={
          <>
            {/* Nivel de escolaridad */}
            <div className="card-simple">
              <SectionHeader titulo="Nivel de escolaridad" icono={GraduationCap} />
              <div className="lista-barras">
                {escolaridadData.map((item) => (
                  <div key={item.nivel} className="barra-item">
                    <div className="barra-item-header">
                      <span>{item.nivel}</span>
                      <strong>{item.total}</strong>
                    </div>
                    <div className="barra-fondo">
                      <div
                        className="barra-progreso"
                        style={{ width: item.porcentaje }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Situación laboral */}
            {situacionData.length > 0 && (
              <div className="card-simple">
                <SectionHeader titulo="Situación laboral" icono={UserCheck} />
                <div className="lista-barras">
                  {situacionData.map((item) => (
                    <div key={item.situacion} className="barra-item">
                      <div className="barra-item-header">
                        <span>{item.situacion}</span>
                        <strong>{item.total}</strong>
                      </div>
                      <div className="barra-fondo">
                        <div
                          className="barra-progreso"
                          style={{ width: item.porcentaje }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estados */}
            {estadoData.length > 0 && (
              <div className="card-simple">
                <SectionHeader titulo="Estatus" icono={CalendarDays} />
                <div className="estados-grid">
                  {estadoData.map((item) => (
                    <div
                      className={`estado-card ${item.fondo}`}
                      key={item.nombre}
                    >
                      <div className="estado-card-info">
                        <p className="estado-card-nombre">{item.nombre}</p>
                        <p className="estado-card-valor">
                          {item.valor.toLocaleString("es-MX")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        }
      />

      {/* MODAL */}
      {buscadorSeleccionado && (
        <div
          className="buscadores-modal-overlay"
          onClick={() => setBuscadorSeleccionado(null)}
        >
          <div
            className="buscadores-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="buscadores-modal-header">
              <div className="buscadores-modal-header-info">
                <div className="buscadores-modal-icon">
                  <Users size={20} />
                </div>
                <div>
                  <h2>Perfil del buscador</h2>
                  <p>Registro #{buscadorSeleccionado.id || "-"}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setBuscadorSeleccionado(null)}
                className="buscadores-modal-close"
              >
                <XCircle size={18} />
              </button>
            </div>

            <div className="buscadores-modal-grid">
              <div>
                <p>Nombre completo</p>
                <strong>{buscadorSeleccionado.nombre || "No especificado"}</strong>
              </div>
              <div>
                <p>CURP</p>
                <strong>{buscadorSeleccionado.curp || "No especificado"}</strong>
              </div>
              <div>
                <p>Fecha de registro</p>
                <strong>{formatearFecha(buscadorSeleccionado.fechaRegistro)}</strong>
              </div>
              <div>
                <p>Edad</p>
                <strong className="numero-blue">
                  {buscadorSeleccionado.edad || "-"} años
                </strong>
              </div>
              <div>
                <p>Género</p>
                <strong>{buscadorSeleccionado.genero || "No especificado"}</strong>
              </div>
              <div>
                <p>Municipio</p>
                <strong>{buscadorSeleccionado.municipio || "No especificado"}</strong>
              </div>
              <div>
                <p>Escolaridad</p>
                <strong>{buscadorSeleccionado.escolaridad || "No especificado"}</strong>
              </div>
              <div>
                <p>Situación laboral</p>
                <span className="badge-estatus">
                  {buscadorSeleccionado.situacionLaboral || "No especificado"}
                </span>
              </div>
              <div>
                <p>Motivo de no trabajar</p>
                <strong>{buscadorSeleccionado.motivoNoTrabaja || "No especificado"}</strong>
              </div>
              <div>
                <p>Estado</p>
                <EstadoBadge
                  estado={buscadorSeleccionado.estado || "No especificado"}
                />
              </div>
              <div>
                <p>Unidad operativa</p>
                <strong>{buscadorSeleccionado.unidadOperativa || "No especificado"}</strong>
              </div>
            </div>

            <div className="buscadores-modal-footer">
              <button
                type="button"
                onClick={() => setBuscadorSeleccionado(null)}
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