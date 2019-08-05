const router = require('express').Router()

router.use('/project/:projectId/groups', require('./group.router'))
router.use('/project/:projectId/shifts', require('./shift.router'))
router.use('/group/:groupId/employees', require('./employeeGroup.router'))
router.use('/project/:projectId/shift-roster', require('./shiftRoster.router'))
router.use('/project/:projectId/working-day', require('./generalWorkingDay.router'))
router.use('/project/:projectId/general-roster', require('./generalRoster.router'))
router.use('/project/:projectId/attendance-data', require('./attendanceData.router'))
router.use('/project/:projectId/upload', require('./upload.router'))
router.use('/project/:projectId/employee-wise-roster', require('./empWiseRoster.router'))

module.exports = router