import React from "react";

import {
  UserRound,
  Clock3,
  UserCheck,
  CircleCheck,
} from "lucide-react";

export default function EstadoBadge({
  estado,
}) {

  const configuracion = {

    Disponible: {
      clase: "estado-badge estado-disponible",
      icono: UserRound,
    },

    "En proceso": {
      clase: "estado-badge estado-proceso",
      icono: Clock3,
    },

    Vinculado: {
      clase: "estado-badge estado-vinculado",
      icono: UserCheck,
    },

    Colocado: {
      clase: "estado-badge estado-colocado",
      icono: CircleCheck,
    },

    Inactivo: {
      clase: "estado-badge estado-inactivo",
      icono: Clock3,
    },

  };


  const config =
    configuracion[estado] ||
    configuracion.Disponible;

  const Icon = config.icono;


  return (
    <span className={config.clase}>

      <Icon size={13} />

      {estado}

    </span>
  );
}