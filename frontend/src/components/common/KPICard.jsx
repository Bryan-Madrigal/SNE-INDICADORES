import React from "react";

export default function KPICard({
  titulo,
  valor,
  descripcion,
  icono: Icon,
  color = "blue",
}) {
  return (
    <div className="indicador">
      <div className="indicador-contenido">

        <div>
          <p className="indicador-titulo">
            {titulo}
          </p>

          <p className="indicador-valor">
            {valor}
          </p>

          {descripcion && (
            <p className="indicador-descripcion">
              {descripcion}
            </p>
          )}
        </div>

        <div className={`indicador-icono indicador-icono--${color}`}>
          {Icon && <Icon size={22} />}
        </div>

      </div>
    </div>
  );
}