const router = require('express').Router();
const { creer, modifier, supprimer } = require('../controllers/commentaire.controller');
const { auth } = require('../middlewares/auth.middleware');

router.post('/', auth, creer);
router.put('/:id', auth, modifier);
router.delete('/:id', auth, supprimer);

module.exports = router;
