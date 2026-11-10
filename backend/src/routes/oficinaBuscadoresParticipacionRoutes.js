const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const {
    getOficinaBuscadoresParticipacion,
    guardarOficinaBuscadoresParticipacion,
} = require('../controllers/oficinaBuscadoresParticipacionController');

// GET /api/oficina-buscadores-participacion?anio=2026
router.get('/', verificarToken, getOficinaBuscadoresParticipacion);

// POST /api/oficina-buscadores-participacion
router.post('/', verificarToken, guardarOficinaBuscadoresParticipacion);

module.exports = router;
