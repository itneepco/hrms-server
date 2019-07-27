const router = require('express').Router()

router.use('/project/:projectId/groups', require('./group.router'))
router.use('/project/:projectId/shifts', require('./shift.router'))
router.use('/group/:groupId/employees', require('./employeeGroup.router'))
router.use('/project/:projectId/group-roster', require('./groupRoster.router'))
router.use('/project/:projectId/working-day', require('./generalWorkingDay.router'))
router.use('/project/:projectId/general-roster', require('./generalRoster.router'))

module.exports = router