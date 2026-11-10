import React from "react";
import "./PageHeader.css";

export default function PageHeader({
  icono: Icon,
  titulo,
  descripcion,
  acciones,
}) {
  return (
    <div className="page-header">

      {/* IZQUIERDA: ícono + títulos */}
      <div className="page-header-left">
        {Icon && (
          <div className="page-header-icon">
            <Icon size={26} />
          </div>
        )}

        <div className="page-header-text">
          <h1 className="page-header-title">{titulo}</h1>
          {descripcion && (
            <p className="page-header-subtitle">{descripcion}</p>
          )}
        </div>
      </div>

      {/* DERECHA: acciones */}
      {acciones && (
        <div className="page-header-actions">
          {acciones}
        </div>
      )}
    </div>
  );
}