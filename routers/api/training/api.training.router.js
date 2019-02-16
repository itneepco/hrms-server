const router = require('express').Router()
const validateTrainingAdmin = require('../../../middlewares/validateTrainingAdmin');

router.use('/institute', validateTrainingAdmin, require('./training_institute.router'))
router.use('/info/:trainingId/topic', validateTrainingAdmin, require('./training_topic.router'))
router.use('/info/:trainingId/participant', validateTrainingAdmin, require('./training_participant.router'))

router.use('/info', require('./training.router')) //authorization is done inside the training router

module.exports = router