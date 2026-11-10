const express = require('express');
const router = express.Router();
const { getPorOficina, getPorMunicipio } = require('../controllers/geograficoController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.use(verificarToken);

router.get('/estadisticas/por-oficina', getPorOficina);
router.get('/estadisticas/por-municipio', getPorMunicipio);

module.exports = router;