const router = require('express').Router()

router.use('/projects', require('./projects.router'))
router.use('/employees', require('./employee.router'))
router.use('/hierarchy', require('./hierarchy.router'))
router.use('/leave', require('./leave.router'))
router.use('/leave/apply', require('./leave_application.router'))
router.use('/leave/request', require('./leave_request_process'))

module.exports = router