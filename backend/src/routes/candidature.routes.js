const router = require('express').Router();
const { postuler, updateStatut, annuler } = require('../controllers/candidature.controller');
const { auth } = require('../middlewares/auth.middleware');

router.post('/', auth, postuler);
router.put('/:id/statut', auth, updateStatut);
router.delete('/:id', auth, annuler);

module.exports = router;
