const express = require("express");

const router = express.Router();

const {
    obtenerOfertasActivas
} = require("../controllers/OfertasActivasController");

const {
    verificarToken
} = require("../middlewares/authMiddleware");


// =====================================================
// OBTENER OFERTAS ACTIVAS
// GET /api/ofertas
// =====================================================

router.get(
    "/",
    verificarToken,
    obtenerOfertasActivas
);


module.exports = router;