const express = require('express');
const router = express.Router();
const { getResumenKPIs } = require('../controllers/kpiController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Endpoint para el resumen principal. Protegido mediante JWT.
router.get('/resumen', verificarToken, getResumenKPIs);

module.exports = router;