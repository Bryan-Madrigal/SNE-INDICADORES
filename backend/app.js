  const express = require('express');
  const cors = require('cors');
  const bodyParser = require('body-parser');
  require('dotenv').config();

  const app = express();
  const PORT = process.env.PORT || 5000;

  // Middlewares
  app.use(cors());
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true, parameterLimit: 100000 }));

  // Básicos
  app.get('/', (req, res) => {
    res.send('API Dashboard SNE is running');
  });

  // Importar rutas
  const authRoutes = require('./src/routes/authRoutes');
  const kpiRoutes = require('./src/routes/kpiRoutes');
  const indicadoresRoutes = require('./src/routes/indicadoresRoutes');
  const causasRoutes = require('./src/routes/causasRoutes');
  const geograficoRoutes = require('./src/routes/geograficoRoutes');
  const demograficoRoutes = require('./src/routes/demograficoLaboralRoutes');
  const avancesRoutes = require('./src/routes/avancesRoutes');
  const metasRoutes = require('./src/routes/metasRoutes');
  const asignacionMetasGlobalesRoutes = require('./src/routes/asignacionMetasGlobalesRoutes');
  const tipoMetaParticipacionRoutes = require('./src/routes/tipoMetaParticipacionRoutes');
  const oficinaBuscadoresParticipacionRoutes = require('./src/routes/oficinaBuscadoresParticipacionRoutes');
  const reportesRoutes = require('./src/routes/reportesRoutes');
  const configRoutes = require('./src/routes/configRoutes');
  const colocacionesRoutes = require('./src/routes/ColocacionesRoutes');
  const empresasAtendidasRoutes = require("./src/routes/EmpresasAtendidasRoutes");
  const ofertasActivasRoutes = require("./src/routes/OfertasActivasRoutes");
  const buscadoresEmpleoRoutes = require("./src/routes/BuscadoresEmpleoRoutes");
  const citasRoutes = require("./src/routes/CitasRoutes");
  const vinculacionesRoutes = require("./src/routes/VinculacionesRoutes");
  const atencionesRoutes = require("./src/routes/AtencionesRoutes");

  app.use('/api/auth', authRoutes);
  app.use('/api/kpis', kpiRoutes);
  app.use('/api/avances', avancesRoutes);
  app.use('/api/metas', metasRoutes);
  app.use('/api/asignacion-global', asignacionMetasGlobalesRoutes);
  app.use('/api/tipo-meta-participacion', tipoMetaParticipacionRoutes);
  app.use('/api/oficina-buscadores-participacion', oficinaBuscadoresParticipacionRoutes);
  app.use('/api/config', configRoutes);
  app.use('/api', indicadoresRoutes);
  app.use('/api', causasRoutes);
  app.use('/api', geograficoRoutes);
  app.use('/api', demograficoRoutes);
  app.use('/api/reportes', reportesRoutes);
  app.use('/api', colocacionesRoutes);
  app.use("/api/empresas", empresasAtendidasRoutes);
  app.use("/api/ofertas",ofertasActivasRoutes);
  app.use("/api", buscadoresEmpleoRoutes);
  app.use("/api/citas", citasRoutes);
  app.use("/api/vinculaciones", vinculacionesRoutes);
  app.use("/api/atenciones", atencionesRoutes);
  
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
