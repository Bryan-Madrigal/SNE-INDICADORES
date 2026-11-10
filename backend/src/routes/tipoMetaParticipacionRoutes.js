const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middlewares/authMiddleware');
const { getTipoMetaParticipacion, guardarTipoMetaParticipacion } = require('../controllers/tipoMetaParticipacionController');

router.use(verificarToken);

router.get('/', getTipoMetaParticipacion);
router.post('/', guardarTipoMetaParticipacion);

module.exports = router;
