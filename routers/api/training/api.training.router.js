const router = require('express').Router()
const validateTrainingAdmin = require('../../../middlewares/validateTrainingAdmin');

//Router for employee access
router.use('/employee', require('./employee_training.router'))
router.use('/info/:trainingId/feedback/', require('./training_feedback.router'))
router.use('/executive-needs', require('./training_executive_need.router'))
router.use('/needs-info', require('./training_needs_info.router'))

//Router for training admin access
router.use('/label', validateTrainingAdmin, require('./training_label.router'))
router.use('/institute', validateTrainingAdmin, require('./training_institute.router'))
router.use('/info/:trainingId/topic', validateTrainingAdmin, require('./training_topic.router'))
router.use('/info/:trainingId/participant', validateTrainingAdmin, require('./training_participant.router'))
router.use('/info', validateTrainingAdmin, require('./admin_training.router'))

module.exports = router