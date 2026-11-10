import React from "react";
import "./SectionHeader.css"; // ← Agrega esta línea si no está

export default function SectionHeader({
  titulo,
  descripcion,
  icono: Icono,
  acciones,
}) {
  return (
    <div className="section-header">
      <div className="section-header-contenido">
        {Icono && (
          <div className="section-header-icono">
            <Icono size={20} />
          </div>
        )}
        <div>
          <h3 className="section-header-titulo">{titulo}</h3>
          {descripcion && (
            <p className="section-header-descripcion">{descripcion}</p>
          )}
        </div>
      </div>

      {acciones && <div className="section-header-acciones">{acciones}</div>}
    </div>
  );
}