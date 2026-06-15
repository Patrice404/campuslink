const router = require('express').Router();
const { inscription, connexion, me } = require('../controllers/auth.controller');
const { auth } = require('../middlewares/auth.middleware');

router.post('/inscription', inscription);
router.post('/connexion', connexion);
router.get('/me', auth, me);

module.exports = router;
