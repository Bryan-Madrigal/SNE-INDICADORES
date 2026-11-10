import {
  Search,
  SlidersHorizontal,
} from "lucide-react";

export default function FiltrosOfertas({
  busqueda,
  setBusqueda,

  municipio,
  setMunicipio,

  categoria,
  setCategoria,

  escolaridad,
  setEscolaridad,

  licencia,
  setLicencia,

  municipios = [],
  categorias = [],
  escolaridades = [],

  limpiarFiltros,
}) {
  return (
    <div className="filters-wrapper">

      <div className="filters-grid">

        {/* =========================================
            BUSCAR OFERTA
        ========================================= */}

        <div className="filter-item filter-item-search">

          <label className="filter-label">
            Buscar oferta
          </label>

          <div className="search-input-wrapper">

            <Search
              size={18}
              className="search-icon"
            />

            <input
              type="text"
              value={busqueda || ""}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Buscar por puesto, empresa o municipio"
              className="search-input"
            />

          </div>

        </div>


        {/* =========================================
            MUNICIPIO
        ========================================= */}

        <div className="filter-item">

          <label className="filter-label">
            Municipio
          </label>

          <select
            value={municipio || "Todos"}
            onChange={(e) =>
              setMunicipio(e.target.value)
            }
            className="filter-select"
          >

            {municipios.length > 0 ? (

              municipios.map((nombre) => (

                <option
                  key={String(nombre)}
                  value={String(nombre)}
                >
                  {nombre}
                </option>

              ))

            ) : (

              <option value="Todos">
                Todos
              </option>

            )}

          </select>

        </div>


        {/* =========================================
            CATEGORÍA
        ========================================= */}

        <div className="filter-item">

          <label className="filter-label">
            Categoría
          </label>

          <select
            value={categoria || "Todas"}
            onChange={(e) =>
              setCategoria(e.target.value)
            }
            className="filter-select"
          >

            {categorias.length > 0 ? (

              categorias.map((nombre) => (

                <option
                  key={String(nombre)}
                  value={String(nombre)}
                >
                  {nombre}
                </option>

              ))

            ) : (

              <option value="Todas">
                Todas
              </option>

            )}

          </select>

        </div>


        {/* =========================================
            ESCOLARIDAD
        ========================================= */}

        <div className="filter-item">

          <label className="filter-label">
            Escolaridad
          </label>

          <select
            value={escolaridad || "Todas"}
            onChange={(e) =>
              setEscolaridad(e.target.value)
            }
            className="filter-select"
          >

            {escolaridades.length > 0 ? (

              escolaridades.map((nombre) => (

                <option
                  key={String(nombre)}
                  value={String(nombre)}
                >
                  {nombre}
                </option>

              ))

            ) : (

              <option value="Todas">
                Todas
              </option>

            )}

          </select>

        </div>


        {/* =========================================
            LICENCIA
        ========================================= */}

        <div className="filter-item">

          <label className="filter-label">
            Licencia
          </label>

          <select
            value={licencia || "Todos"}
            onChange={(e) =>
              setLicencia(e.target.value)
            }
            className="filter-select"
          >

            <option value="Todos">
              Todos
            </option>

            <option value="Requerida">
              Requerida
            </option>

            <option value="No requerida">
              No requerida
            </option>

          </select>

        </div>

      </div>


      {/* =========================================
          ACCIONES
      ========================================= */}

      <div className="filters-actions">

        <button
          type="button"
          className="btn-clear"
          onClick={limpiarFiltros}
        >

          <SlidersHorizontal
            size={17}
          />

          Limpiar filtros

        </button>

      </div>

    </div>
  );
}