const router = require('express').Router();
const { lister, marquerLue, marquerToutesLues } = require('../controllers/notification.controller');
const { auth } = require('../middlewares/auth.middleware');

router.get('/', auth, lister);
// /lire-tout avant /:id pour éviter conflit de paramètre
router.put('/lire-tout', auth, marquerToutesLues);
router.put('/:id/lue', auth, marquerLue);

module.exports = router;
