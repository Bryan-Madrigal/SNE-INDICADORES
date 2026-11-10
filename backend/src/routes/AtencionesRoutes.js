const express = require("express");
const router = express.Router();

const {
    obtenerAtenciones
} = require("../controllers/AtencionesController");

const {
    verificarToken
} = require("../middlewares/authMiddleware");

// =====================================================
// OBTENER ATENCIONES
// GET /api/atenciones
// =====================================================

router.get("/", verificarToken, obtenerAtenciones);

module.exports = router;