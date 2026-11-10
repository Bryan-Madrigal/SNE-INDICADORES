import React from "react";
import { Building2 } from "lucide-react";

export default function InfoModulo({
  titulo = "Información del módulo",
  descripcion = "",
  icono: Icon = Building2,
  mostrarIcono = true,
}) {
  return (
    <div className="info-modulo">

      <div className="info-modulo-inner">

        {mostrarIcono && (
          <div className="info-modulo-icono">

            <Icon size={20} />

          </div>
        )}

        <div>

          <h3 className="info-modulo-titulo">
            {titulo}
          </h3>

          <p className="info-modulo-texto">
            {descripcion}
          </p>

        </div>

      </div>

    </div>
  );
}