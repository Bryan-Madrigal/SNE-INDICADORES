const express = require("express");
const router = express.Router();
const { verificarToken } = require("../middlewares/authMiddleware");
const { obtenerCitas } = require("../controllers/CitasController");

router.get("/", verificarToken, obtenerCitas);

module.exports = router;