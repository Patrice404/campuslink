const router = require('express').Router();
const { lister } = require('../controllers/campus.controller');

router.get('/', lister);

module.exports = router;
