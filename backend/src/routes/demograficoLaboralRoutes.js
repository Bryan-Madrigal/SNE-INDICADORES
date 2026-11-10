const express = require('express');
const router = express.Router();
const { getPorGenero, getPorEdad, getPorEscolaridad, getSueldosTop10, getPuestosSolicitados } = require('../controllers/demograficoLaboralController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/estadisticas/por-genero', getPorGenero);
router.get('/estadisticas/por-edad', getPorEdad);
router.get('/estadisticas/por-escolaridad', getPorEscolaridad);
router.get('/sueldos/top10', getSueldosTop10);
router.get('/puestos/mas-solicitados', getPuestosSolicitados);

module.exports = router;
