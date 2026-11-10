const express = require("express");

const router = express.Router();

const {
    obtenerVinculaciones,
    obtenerVinculacionPorId
} = require("../controllers/VinculacionesController");

router.get("/", obtenerVinculaciones);

router.get("/:id", obtenerVinculacionPorId);

module.exports = router;