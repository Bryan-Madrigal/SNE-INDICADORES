const express = require('express');
const router = express.Router();
const { getMetas, upsertMeta, deleteMeta } = require('../controllers/metasController');
const { generarDistribucionMetasExcel } = require('../controllers/distribucionMetasController');
const multer = require('multer');
const { verificarToken } = require('../middlewares/authMiddleware');

const upload = multer({ storage: multer.memoryStorage() });

router.use(verificarToken);

router.get('/', getMetas);
router.post('/', upsertMeta);
router.delete('/:id', deleteMeta);
router.post('/distribucion/excel', upload.single('file'), generarDistribucionMetasExcel);

module.exports = router;