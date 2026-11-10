const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const {
    obtenerEmpresas,
    obtenerEmpresaPorId
} = require('../controllers/EmpresasAtendidasController');

// GET /api/empresas?fechaInicio=...&fechaFin=...&municipio=...&busqueda=...
router.get('/', verificarToken, obtenerEmpresas);

// GET /api/empresas/:cveEmpresa
router.get('/:cveEmpresa', verificarToken, obtenerEmpresaPorId);

module.exports = router;