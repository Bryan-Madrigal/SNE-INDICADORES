
import React from "react";
import { ChevronDown } from "lucide-react";

export default function Filtro({
  children,
  valor,
  onChange,
  opciones = [],
  placeholder,
  className = "",
}) {
  return (
    <div className={`filtro-wrapper ${className}`}>
      <select
        value={valor ?? ""}
        onChange={onChange}
        className="filtro-select"
      >
        {placeholder && (
          <option value="">
            {placeholder}
          </option>
        )}

        {opciones.map((opcion, index) => {
          const value =
            typeof opcion === "object"
              ? opcion.value
              : opcion;

          const label =
            typeof opcion === "object"
              ? opcion.label
              : opcion;

          return (
            <option
              key={`${value}-${index}`}
              value={value}
            >
              {label}
            </option>
          );
        })}
      </select>

      {!onChange && (
        <div className="filtro-contenido">
          <span>{children}</span>
          <ChevronDown size={15} />
        </div>
      )}
    </div>
  );
}
