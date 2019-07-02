const router = require('express').Router()

router.use('/project/:projectId/groups', require('./group.router'))
router.use('/project/:projectId/shifts', require('./shift.router'))
router.use('/group/:groupId/employees', require('./employeeGroup.router'))

module.exports = router