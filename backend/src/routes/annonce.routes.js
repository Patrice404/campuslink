const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { lister, detail, mesAnnonces, creer, modifier, supprimer } = require('../controllers/annonce.controller');
const { toggle } = require('../controllers/jaime.controller');
const { auth } = require('../middlewares/auth.middleware');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// ordre important : /mes avant /:id pour éviter que "mes" soit capturé comme id
router.get('/', lister);
router.get('/mes', auth, mesAnnonces);
router.get('/:id', detail);
router.post('/', auth, upload.single('image'), creer);
router.put('/:id', auth, upload.single('image'), modifier);
router.delete('/:id', auth, supprimer);
router.post('/:id/jaime', auth, toggle);

module.exports = router;
