const express = require('express');
const router = express.Router();
const { getAvancesBT, getSegmentos, getOficinas } = require('../controllers/avancesController');
const { exportAvancesAtendidosExcel } = require('../controllers/exportExcelController');
const { verificarToken } = require('../middlewares/authMiddleware');

// GET /api/avances/bt?mes=1&anio=2026&segmento=General
router.get('/bt',  getAvancesBT);

// GET /api/avances/segmentos
router.get('/segmentos',  getSegmentos);

// GET /api/avances/oficinas
router.get('/oficinas', getOficinas);

// GET /api/avances/export?mes=1&anio=2026&segmento=General
router.get('/export', exportAvancesAtendidosExcel);

module.exports = router;
