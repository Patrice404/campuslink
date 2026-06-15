const router = require('express').Router();
const { lister } = require('../controllers/matiere.controller');

router.get('/', lister);

module.exports = router;
