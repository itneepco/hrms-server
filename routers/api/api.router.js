const router = require('express').Router()
const validateAdmin = require('../../middlewares/validateAdmin');
const validateSuperAdmin = require('../../middlewares/validateSuperAdmin');
const validateItAdmin = require('../../middlewares/validateItAdmin');

//Routes Validation for Admin
router.use('/leave/ledger', validateAdmin)

router.use('/leave-types',require('./shared/leaveTypes.router'));

//Routes Validation for Super Admin
router.use('/rolemapper', validateSuperAdmin, require('./leave/role_mapper.router'))
router.use('/leave/credit', validateItAdmin, require('./leave/periodic_leave_credit'))
router.use('/projects/:id/holidays', require('./shared/holiday.router'))

router.use('/projects', require('./leave/projects.router'))
router.use('/employees', require('./shared/employee.router'))
router.use('/leave', require('./leave/leave_ledger.router'))
router.use('/leave/detail', require('./leave/leave_detail.router'))
router.use('/leave/apply', require('./leave/leave_application.router'))
router.use('/leave/request', require('./leave/leave_request_process.router'))

router.use('/pay-image', require('./salary/pay_image.router'))
router.use('/hierarchy', require('./shared/hierarchy.router'))
router.use('/joining-report', require('./leave/joining_report.router'))
//---Atendance  Routes
router.use('/attendance', require('./attendance/api.attendance.router'))
//Training Router
router.use('/training', require('./training/api.training.router'))

module.exports = router