const express = require('express');
const router = express.Router();
const { 
    getUnidadesOperativas,
    getReporteAtenciones,
    getReportePostulaciones,
    getReporteColocaciones,
    getReporteVacantes
} = require('../controllers/reportesController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/unidades', getUnidadesOperativas);
router.get('/atenciones', getReporteAtenciones);
router.get('/postulaciones', getReportePostulaciones);
router.get('/colocaciones', getReporteColocaciones);
router.get('/vacantes', getReporteVacantes);

module.exports = router;