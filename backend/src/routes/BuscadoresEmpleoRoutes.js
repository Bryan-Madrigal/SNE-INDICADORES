const express = require("express");

const router = express.Router();

const {
    obtenerBuscadores
} = require("../controllers/BuscadoresEmpleoController");

router.get(
    "/buscadores",
    obtenerBuscadores
);

module.exports = router;