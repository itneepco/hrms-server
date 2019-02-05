const router = require('express').Router()
const validateAdmin = require('../../../middlewares/validateAdmin');
const validateSuperAdmin = require('../../../middlewares/validateSuperAdmin');
const validateItAdmin = require('../../../middlewares/validateItAdmin');

router.use('/institute', require('./training_institute.router'))

module.exports = router