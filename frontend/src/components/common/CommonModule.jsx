import React from "react";
import { RefreshCw } from "lucide-react";

// Componentes comunes
import PageHeader from "./PageHeader";
import KPIGrid from "./KPIGrid";
import SearchBar from "./SearchBar";
import DataTable from "./DataTable";
import InfoModulo from "./InfoModulo";
import SectionHeader from "./SectionHeader";

export default function CommonModule({
  // =================================================
  // CABECERA
  // =================================================
  titulo = "Módulo",
  descripcion = "",
  icono: Icono,
  accionesExtra,

  // =================================================
  // DATOS
  // =================================================
  datos = [],
  cargando = false,
  error = "",
  onRecargar,

  // =================================================
  // KPIs
  // =================================================
  indicadores = [],

  // =================================================
  // TABLA
  // =================================================
  columnas = [],
  renderCelda,
  filaKey,
  mensajeVacio = "No hay registros que coincidan con los filtros.",
  tablaPersonalizada,

  // =================================================
  // BUSCADOR Y FILTROS
  // =================================================
  busqueda = "",
  onBusqueda,
  filtrosPersonalizados,
  onLimpiarFiltros,
  onAplicarFiltros,

  // =================================================
  // FECHAS
  // =================================================
  fechaInicial = "",
  setFechaInicial,
  fechaFinal = "",
  setFechaFinal,
  periodo = "todos",
  setPeriodo,
  onConsultarFechas,

  // =================================================
  // SECCIONES EXTRA
  // =================================================
  seccionesExtra,

  // =================================================
  // PAGINACIÓN
  // =================================================
  paginaActual = 1,
  setPaginaActual,
  registrosPorPagina = 10,
}) {
  // =================================================
  // CÁLCULOS DE PAGINACIÓN
  // =================================================
  const totalRegistros = datos.length;
  const totalPaginas = Math.max(
    1,
    Math.ceil(totalRegistros / registrosPorPagina)
  );
  const indiceInicio = (paginaActual - 1) * registrosPorPagina;
  const indiceFin = Math.min(
    indiceInicio + registrosPorPagina,
    totalRegistros
  );
  const datosPaginados = datos.slice(indiceInicio, indiceFin);

  // Generar números de página visibles
  const paginasVisibles = () => {
    const paginas = [];
    const maxBotones = 5;
    let inicio = Math.max(1, paginaActual - 2);
    let fin = Math.min(totalPaginas, inicio + maxBotones - 1);

    if (fin - inicio + 1 < maxBotones) {
      inicio = Math.max(1, fin - maxBotones + 1);
    }

    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    return paginas;
  };

  // =================================================
  // RENDER
  // =================================================
  return (
    <div className="app-container">

      {/* =================================================
          1. HEADER
      ================================================= */}
      <PageHeader
        icono={Icono}
        titulo={titulo}
        descripcion={descripcion}
        acciones={
          <>
            {accionesExtra}
            {onRecargar && (
              <button
                type="button"
                className="btn btn-outline"
                onClick={onRecargar}
                disabled={cargando}
              >
                <RefreshCw
                  size={17}
                  className={cargando ? "animate-spin" : ""}
                />
                Actualizar
              </button>
            )}
          </>
        }
      />

      {/* =================================================
          2. FILA DE PERÍODO Y FECHAS
      ================================================= */}
      {(setFechaInicial || setFechaFinal) && (
        <div className="filtros-fila">
          {setPeriodo && (
            <div>
              <label>Período</label>
              <select
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
              >
                <option value="todos">Todos los tiempos</option>
                <option value="diario">Hoy</option>
                <option value="semanal">Últimos 7 días</option>
                <option value="mensual">Este mes</option>
                <option value="anual">Este año</option>
                <option value="personalizado">Personalizado</option>
              </select>
            </div>
          )}

          {setFechaInicial && (
            <div>
              <label>Fecha inicial</label>
              <input
                type="date"
                value={fechaInicial}
                onChange={(e) => setFechaInicial(e.target.value)}
              />
            </div>
          )}

          {setFechaFinal && (
            <div>
              <label>Fecha final</label>
              <input
                type="date"
                value={fechaFinal}
                min={fechaInicial}
                onChange={(e) => setFechaFinal(e.target.value)}
              />
            </div>
          )}

          {onConsultarFechas && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onConsultarFechas}
            >
              Consultar
            </button>
          )}
        </div>
      )}

      {/* =================================================
          3. KPIs
      ================================================= */}
      {indicadores.length > 0 && <KPIGrid indicadores={indicadores} />}

      {/* =================================================
          4. BUSCADOR + FILTROS + ACCIONES
      ================================================= */}
      {(onBusqueda || filtrosPersonalizados) && (
        <div className="filtros-fila">
          {onBusqueda && (
            <SearchBar
              label="Buscar"
              placeholder={`Buscar en ${titulo.toLowerCase()}...`}
              valor={busqueda}
              onChange={(e) =>
                onBusqueda(typeof e === "string" ? e : e.target.value)
              }
              filtros={filtrosPersonalizados}
              acciones={
                <>
                  {onLimpiarFiltros && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={onLimpiarFiltros}
                    >
                      Limpiar filtros
                    </button>
                  )}

                  {onAplicarFiltros && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={onAplicarFiltros}
                    >
                      Aplicar filtros
                    </button>
                  )}
                </>
              }
            />
          )}
        </div>
      )}

      {/* =================================================
          5. ERROR
      ================================================= */}
      {error && (
        <div className="error-container">
          <h3>Error al cargar los datos</h3>
          <p>{error}</p>
          {onRecargar && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={onRecargar}
            >
              Reintentar
            </button>
          )}
        </div>
      )}

      {/* =================================================
          6. TABLA
      ================================================= */}
      <div className="card-tabla">
        <SectionHeader
          titulo={`Registro de ${titulo.toLowerCase()}`}
          descripcion={
            cargando
              ? "Cargando información..."
              : `${totalRegistros.toLocaleString("es-MX")} registros encontrados`
          }
        />

        {cargando ? (
          <div className="loading-container">
            <p>Cargando datos...</p>
          </div>
        ) : datos.length === 0 ? (
          <div className="loading-container">
            <p>{mensajeVacio}</p>
          </div>
        ) : (
          <>
            {tablaPersonalizada ? (
              tablaPersonalizada
            ) : (
              <DataTable
                columnas={columnas}
                datos={datosPaginados}
                renderCelda={renderCelda}
                filaKey={filaKey}
                mensajeVacio={mensajeVacio}
              />
            )}

            {totalRegistros > 0 && setPaginaActual && (
              <div className="tabla-paginacion">
                <p>
                  Mostrando <strong>{indiceInicio + 1}</strong> -{" "}
                  <strong>{indiceFin}</strong> de{" "}
                  <strong>{totalRegistros.toLocaleString("es-MX")}</strong>
                </p>

                <div className="tabla-paginacion-botones">
                  <button
                    type="button"
                    className="pagina-btn"
                    disabled={paginaActual === 1}
                    onClick={() => setPaginaActual(paginaActual - 1)}
                  >
                    Anterior
                  </button>

                  {paginasVisibles().map((p) => (
                    <button
                      key={p}
                      type="button"
                      className={`pagina-btn ${
                        p === paginaActual ? "pagina-btn-activa" : ""
                      }`}
                      onClick={() => setPaginaActual(p)}
                    >
                      {p}
                    </button>
                  ))}

                  <button
                    type="button"
                    className="pagina-btn"
                    disabled={paginaActual === totalPaginas}
                    onClick={() => setPaginaActual(paginaActual + 1)}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* =================================================
          7. SECCIONES EXTRA
      ================================================= */}
      {seccionesExtra}

      {/* =================================================
          8. INFO DEL MÓDULO
      ================================================= */}
      <InfoModulo
        titulo={`Acerca de ${titulo}`}
        icono={Icono}
        descripcion={descripcion}
      />
    </div>
  );
}