const router = require('express').Router()

router.use('/project/:projectId/groups', require('./group.router'))
router.use('/project/:projectId/shifts', require('./shift.router'))
router.use('/group/:groupId/employees', require('./employeeGroup.router'))
router.use('/project/:projectId/shift-roster', require('./shiftRoster.router'))
router.use('/project/:projectId/working-day', require('./generalWorkingDay.router'))
router.use('/project/:projectId/general-roster', require('./generalRoster.router'))
router.use('/project/:projectId/attendance-data/upload', require('./uploadAttendanceData.router'))
router.use('/project/:projectId/emp-wise-roster', require('./empWiseRoster.router'))
// router.use('/project/:projectId/attendance-data/process', require('./processAttendanceData.router'))
router.use('/project/:projectId/attendance-data/process', require('./processAttendanceRecords.router'))
router.use('/project/:projectId/wage-month', require('./wageMonth.router'))

module.exports = router