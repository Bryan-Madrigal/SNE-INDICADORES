import React from "react";
import {
  Search,
  SlidersHorizontal,
} from "lucide-react";

export default function FiltrosBuscadores({
  busqueda,
  setBusqueda,

  municipio,
  setMunicipio,

  escolaridad,
  setEscolaridad,

  estado,
  setEstado,

  municipios = [],
  escolaridades = [],
  estados = [],

  limpiarFiltros,
}) {
  return (
    <div className="filters-wrapper">

      <div className="filters-grid">

        {/* BUSCAR */}

        <div className="filter-item filter-item-search">

          <label className="filter-label">
            Buscar buscador
          </label>

          <div className="search-input-wrapper">

            <Search
              size={18}
              className="search-icon"
            />

            <input
              type="text"
              value={busqueda}
              onChange={(e) =>
                setBusqueda(e.target.value)
              }
              placeholder="Nombre, CURP, puesto o municipio"
              className="search-input"
            />

          </div>

        </div>


        {/* MUNICIPIO */}

        <div className="filter-item">

          <label className="filter-label">
            Municipio
          </label>

          <select
            value={municipio}
            onChange={(e) =>
              setMunicipio(e.target.value)
            }
            className="filter-select"
          >

            {municipios.map((nombre) => (
              <option
                key={nombre}
                value={nombre}
              >
                {nombre}
              </option>
            ))}

          </select>

        </div>


        {/* ESCOLARIDAD */}

        <div className="filter-item">

          <label className="filter-label">
            Escolaridad
          </label>

          <select
            value={escolaridad}
            onChange={(e) =>
              setEscolaridad(e.target.value)
            }
            className="filter-select"
          >

            {escolaridades.map((nombre) => (
              <option
                key={nombre}
                value={nombre}
              >
                {nombre}
              </option>
            ))}

          </select>

        </div>


        {/* ESTADO */}

        <div className="filter-item">

          <label className="filter-label">
            Estado
          </label>

          <select
            value={estado}
            onChange={(e) =>
              setEstado(e.target.value)
            }
            className="filter-select"
          >

            {estados.map((nombre) => (
              <option
                key={nombre}
                value={nombre}
              >
                {nombre}
              </option>
            ))}

          </select>

        </div>

      </div>


      {/* LIMPIAR */}

      <div className="filters-actions">

        <button
          type="button"
          className="btn-clear"
          onClick={limpiarFiltros}
        >

          <SlidersHorizontal size={17} />

          Limpiar filtros

        </button>

      </div>

    </div>
  );
}