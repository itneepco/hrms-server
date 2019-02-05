const router = require('express').Router()
const validateAdmin = require('../../middlewares/validateAdmin');
const validateSuperAdmin = require('../../middlewares/validateSuperAdmin');
const validateItAdmin = require('../../middlewares/validateItAdmin');

//Routes Validation for Admin
router.use('/leave/ledger', validateAdmin)
router.use('/projects/:id/holidays', validateAdmin)

//Routes Validation for Super Admin
router.use('/rolemapper', validateSuperAdmin, require('./role_mapper.router'))
router.use('/leave/credit', validateItAdmin, require('./periodic_leave_credit'))

router.use('/projects', require('./projects.router'))
router.use('/employees', require('./employee.router'))
router.use('/leave', require('./leave.router'))
router.use('/leave/apply', require('./leave_application.router'))
router.use('/leave/request', require('./leave_request_process'))
router.use('/pay-image', require('./pay_image.router'))
router.use('/hierarchy', require('./hierarchy.router'))
router.use('/joining-report', require('./joining_report.router'))

//Training Router
router.use('/training', require('./training/api.training.router'))

module.exports = router