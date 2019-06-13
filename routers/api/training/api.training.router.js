const router = require('express').Router()
const validateTrainingAdmin = require('../../../middlewares/validateTrainingAdmin');

//Router for employee access
router.use('/employee', require('./employee_training.router'))
router.use('/info/:trainingId/feedback/', require('./training_feedback.router'))
router.use('/needs-info', require('./training_needs_info.router'))
router.use('/needs-info/:needInfoId/executive-needs', require('./training_executive_need.router'))
router.use('/needs-info/:needInfoId/workflow', require('./needs_workflow.router'))

//Router for training admin access
router.use('/label', validateTrainingAdmin, require('./training_label.router'))
router.use('/institute', validateTrainingAdmin, require('./training_institute.router'))
router.use('/info/:trainingId/topic', validateTrainingAdmin, require('./training_topic.router'))
router.use('/info/:trainingId/participant', validateTrainingAdmin, require('./training_participant.router'))
router.use('/info', validateTrainingAdmin, require('./training_info.router'))
router.use('/calendar', validateTrainingAdmin, require('./training_calendar.router'))

module.exports = router