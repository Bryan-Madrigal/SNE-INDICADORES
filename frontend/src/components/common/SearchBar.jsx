import React from "react";
import { Search } from "lucide-react";
import "./SearchBar.css";

export default function SearchBar({
  label = "Buscar",
  placeholder = "Buscar...",
  valor = "",
  onChange,
  filtros,
  acciones,
}) {
  return (
    <div className="buscador">

      {/* FILA 1: Input de búsqueda + Filtros */}
      <div className="buscador-fila">
        <div className="buscador-input-wrapper">
          <label className="buscador-label">{label}</label>
          <div className="buscador-input-inner">
            <Search size={18} className="buscador-icono" />
            <input
              type="text"
              value={valor}
              onChange={onChange}
              placeholder={placeholder}
              className="buscador-input"
            />
          </div>
        </div>

        {filtros && <div className="buscador-filtros">{filtros}</div>}
      </div>

      {/* FILA 2: Botones de acción */}
      {acciones && <div className="buscador-acciones">{acciones}</div>}
    </div>
  );
}