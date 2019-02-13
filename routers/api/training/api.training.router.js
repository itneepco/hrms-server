const router = require('express').Router()
const validateTrainingAdmin = require('../../../middlewares/validateTrainingAdmin');

router.use('/institute', validateTrainingAdmin, require('./training_institute.router'))

router.use('/info', require('./training.router'))

module.exports = router