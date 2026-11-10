const express = require("express");

const router = express.Router();

const {
    obtenerColocaciones
} = require("../controllers/ColocacionesController");

router.get(
    "/colocaciones",
    obtenerColocaciones
);

module.exports = router;