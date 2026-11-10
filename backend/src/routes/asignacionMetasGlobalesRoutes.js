const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const { generarAsignacionGlobalMetasExcel, guardarAsignacionGlobalMetas, getResumenGlobalMetas } = require('../controllers/asignacionMetasGlobalesController');

router.use(verificarToken);

router.get('/resumen', getResumenGlobalMetas);
router.post('/guardar', guardarAsignacionGlobalMetas);
router.post('/excel', generarAsignacionGlobalMetasExcel);

module.exports = router;