const router = require('express').Router();
const { lister } = require('../controllers/hashtag.controller');

router.get('/', lister);

module.exports = router;
