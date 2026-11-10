import React, { useEffect, useMemo, useState } from "react";
import {
  BriefcaseBusiness,
  XCircle,
  CalendarDays,
  MapPin,
  Building2,
  GraduationCap,
  DollarSign,
} from "lucide-react";

// =====================================================
// COMPONENTES COMUNES
// =====================================================
import CommonModule from "../../../components/common/CommonModule";

// =====================================================
// COMPONENTES LOCALES
// =====================================================
import TablaOfertas from "../../DashboardPages/OfertasActivas/TablaOfertas";
import AnaliticasOfertas from "../../DashboardPages/OfertasActivas/AnaliticasOfertas";

// =====================================================
// API
// =====================================================
import api from "../../../services/api";

import "./OfertasActivas.css";

// =====================================================
// HELPERS
// =====================================================
const obtenerPrimerDiaMes = () => {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`;
};

const obtenerUltimoDiaMes = () => {
  const hoy = new Date();
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(ultimoDia).padStart(2, "0")}`;
};

const formatearSalario = (salario) => {
  const numero = Number(salario);
  if (!numero || Number.isNaN(numero)) return "$0.00";
  return `$${numero.toLocaleString("es-MX", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function OfertasActivas() {
  // =================================================
  // ESTADOS
  // =================================================
  const [ofertas, setOfertas] = useState([]);
  const [indicadores, setIndicadores] = useState([]);
  const [ofertasPorCategoria, setOfertasPorCategoria] = useState([]);
  const [ofertasPorMunicipio, setOfertasPorMunicipio] = useState([]);
  const [ofertasPorEscolaridad, setOfertasPorEscolaridad] = useState([]);
  const [municipios, setMunicipios] = useState(["Todos"]);
  const [escolaridades, setEscolaridades] = useState(["Todas"]);

  // Modal
  const [ofertaSeleccionada, setOfertaSeleccionada] = useState(null);

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [municipio, setMunicipio] = useState("Todos");
  const [escolaridad, setEscolaridad] = useState("Todas");

  // Fechas
  const [fechaInicial, setFechaInicial] = useState(obtenerPrimerDiaMes());
  const [fechaFinal, setFechaFinal] = useState(obtenerUltimoDiaMes());
  const [periodo, setPeriodo] = useState("mensual");

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const REGISTROS_POR_PAGINA = 10;

  // =================================================
  // ACTUALIZAR FECHAS SEGÚN PERÍODO
  // =================================================
  const actualizarFechasPorPeriodo = (nuevoPeriodo) => {
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

  // =================================================
  // CARGAR OFERTAS
  // =================================================
  const cargarOfertas = async () => {
    try {
      setCargando(true);
      setError("");

      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No existe un token de sesión. Inicia sesión nuevamente.");
      }

      const params = new URLSearchParams();
      if (fechaInicial) params.append("fechaInicio", fechaInicial);
      if (fechaFinal) params.append("fechaFin", fechaFinal);
      if (municipio && municipio !== "Todos") params.append("municipio", municipio);
      if (escolaridad && escolaridad !== "Todas") params.append("escolaridad", escolaridad);
      if (busqueda.trim()) params.append("busqueda", busqueda.trim());

      const url = `/ofertas?${params.toString()}`;
      const response = await api.get(url);

      const data = response.data?.data;
      if (!data) throw new Error("La API no devolvió información de ofertas.");

      setOfertas(Array.isArray(data.ofertas) ? data.ofertas : []);
      setIndicadores(Array.isArray(data.indicadores) ? data.indicadores : []);
      setOfertasPorCategoria(Array.isArray(data.ofertasPorCategoria) ? data.ofertasPorCategoria : []);
      setOfertasPorMunicipio(Array.isArray(data.ofertasPorMunicipio) ? data.ofertasPorMunicipio : []);
      setOfertasPorEscolaridad(Array.isArray(data.ofertasPorEscolaridad) ? data.ofertasPorEscolaridad : []);
      setMunicipios(Array.isArray(data.municipios) ? data.municipios : ["Todos"]);
      setEscolaridades(Array.isArray(data.escolaridades) ? data.escolaridades : ["Todas"]);

      setPaginaActual(1);
    } catch (err) {
      console.error("Error cargando ofertas:", err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("No tienes autorización para consultar las ofertas.");
      } else {
        setError(err.response?.data?.message || err.message || "No se pudieron cargar las ofertas.");
      }
      setOfertas([]);
    } finally {
      setCargando(false);
    }
  };

  // =================================================
  // CARGAR AL ENTRAR
  // =================================================
  useEffect(() => {
    cargarOfertas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fechaInicial, fechaFinal, municipio, escolaridad, busqueda]);

  // =================================================
  // LIMPIAR FILTROS
  // =================================================
  const limpiarFiltros = () => {
    setBusqueda("");
    setMunicipio("Todos");
    setEscolaridad("Todas");
    setPeriodo("mensual");
    setFechaInicial(obtenerPrimerDiaMes());
    setFechaFinal(obtenerUltimoDiaMes());
    setPaginaActual(1);
  };

  // =================================================
  // KPIs
  // =================================================
  const indicadoresConIconos = useMemo(() => {
    return indicadores.map((ind) => ({
      ...ind,
      icono: ind.icono || BriefcaseBusiness,
    }));
  }, [indicadores]);

  // =================================================
  // RENDER
  // =================================================
  return (
    <>
      <CommonModule
        titulo="Ofertas Activas"
        descripcion="Consulta el detalle de las ofertas laborales actualmente disponibles."
        icono={BriefcaseBusiness}

        datos={ofertas}
        cargando={cargando}
        error={error}
        onRecargar={cargarOfertas}

        indicadores={indicadoresConIconos}

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
          cargarOfertas();
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
                {municipios.map((m) => (
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
                {escolaridades.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>
          </>
        }
        onLimpiarFiltros={limpiarFiltros}
        onAplicarFiltros={() => {
          setPaginaActual(1);
          cargarOfertas();
        }}

        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        registrosPorPagina={REGISTROS_POR_PAGINA}

        tablaPersonalizada={
          <TablaOfertas
            ofertas={ofertas.slice(
              (paginaActual - 1) * REGISTROS_POR_PAGINA,
              paginaActual * REGISTROS_POR_PAGINA
            )}
            onVerOferta={(oferta) => setOfertaSeleccionada(oferta)}
          />
        }

        seccionesExtra={
          <div className="analiticas-ofertas-pequenas">
            <AnaliticasOfertas
              ofertasPorCategoria={ofertasPorCategoria}
              ofertasPorMunicipio={ofertasPorMunicipio}
              ofertasPorEscolaridad={ofertasPorEscolaridad}
            />
          </div>
        }
      />

      {/* =================================================
          MODAL DE DETALLE DE OFERTA
      ================================================= */}
      {ofertaSeleccionada && (
        <div
          className="ofertas-modal-overlay"
          onClick={() => setOfertaSeleccionada(null)}
        >
          <div
            className="ofertas-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="ofertas-modal-header">
              <div className="ofertas-modal-header-info">
                <div className="ofertas-modal-icon">
                  <BriefcaseBusiness size={20} />
                </div>
                <div>
                  <h2>Detalle de la oferta</h2>
                  <p>
                    Folio #{ofertaSeleccionada.id || ofertaSeleccionada.cveVacante || "-"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOfertaSeleccionada(null)}
                className="ofertas-modal-close"
              >
                <XCircle size={18} />
              </button>
            </div>

            {/* BODY */}
            <div className="ofertas-modal-grid">
              <div>
                <p>Puesto</p>
                <strong>{ofertaSeleccionada.puesto || "-"}</strong>
              </div>

              <div>
                <p>Empresa</p>
                <strong>{ofertaSeleccionada.empresa || "-"}</strong>
              </div>

              <div>
                <p>Municipio</p>
                <strong>{ofertaSeleccionada.municipio || "-"}</strong>
              </div>

              <div>
                <p>Escolaridad</p>
                <strong>{ofertaSeleccionada.escolaridad || "-"}</strong>
              </div>

              <div>
                <p>Vacantes</p>
                <strong className="numero-blue">
                  {Number(ofertaSeleccionada.vacantes || 0).toLocaleString("es-MX")}
                </strong>
              </div>

              <div>
                <p>Salario</p>
                <strong className="numero-green">
                  {formatearSalario(ofertaSeleccionada.salario)}
                </strong>
              </div>

              <div>
                <p>Estatus</p>
                <span className="badge-estatus">
                  {ofertaSeleccionada.estatus || "Activa"}
                </span>
              </div>

              <div>
                <p>Fecha</p>
                <strong>{ofertaSeleccionada.fecha || "-"}</strong>
              </div>
            </div>

            {/* FOOTER */}
            <div className="ofertas-modal-footer">
              <button
                type="button"
                onClick={() => setOfertaSeleccionada(null)}
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