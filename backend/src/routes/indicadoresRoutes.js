const express = require('express');
const router = express.Router();
const { getIndicadoresPeriodo } = require('../controllers/indicadoresController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Protegemos todas las rutas a nivel router
router.use(verificarToken);

// Endpoints principales requeridos para el Módulo 2
router.get('/periodo', getIndicadoresPeriodo);

module.exports = router;