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
router.use('/pay-image', require('./pay_image.router'))
router.use('/rolemapper', require('./role_mapper.router'))
router.use('/hierarchy', require('./hierarchy.router'))
router.use('/joining-report', require('./joining_report.router'))

module.exports = router