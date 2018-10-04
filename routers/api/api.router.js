const router = require('express').Router()
const validateAdmin = require('../../middlewares/validateAdmin');
const validateSuperAdmin = require('../../middlewares/validateSuperAdmin');

//Routes Validation
router.use('/leave/ledger', validateAdmin)
router.use('/rolemapper', validateSuperAdmin)
router.use('/projects/:id/holidays', validateAdmin)

router.use('/projects', require('./projects.router'))
router.use('/employees', require('./employee.router'))
router.use('/leave', require('./leave.router'))
router.use('/leave/apply', require('./leave_application.router'))
router.use('/leave/request', require('./leave_request_process'))
router.use('/payImage', require('./pay_image.router'))
router.use('/rolemapper', require('./role_mapper.router'))
router.use('/hierarchy', require('./hierarchy.router'))

module.exports = router