const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { getProfil, updateProfil } = require('../controllers/utilisateur.controller');
const { auth } = require('../middlewares/auth.middleware');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`),
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } });

router.get('/profil', auth, getProfil);
router.put('/profil', auth, upload.single('photo'), updateProfil);

module.exports = router;
