const router = require('express').Router()

router.use('/project/:projectId/groups', require('./group.router'))
router.use('/project/:projectId/shifts', require('./shift.router'))
router.use('/group/:groupId/employees', require('./employeeGroup.router'))
router.use('/project/:projectId/shift-roster', require('./shiftRoster.router'))
router.use('/project/:projectId/working-day', require('./generalWorkingDay.router'))
router.use('/project/:projectId/general-roster', require('./generalRoster.router'))
router.use('/project/:projectId/attendance-data/upload', require('./uploadAttendanceData.router'))
router.use('/project/:projectId/emp-wise-roster', require('./empWiseRoster.router'))
router.use('/project/:projectId/employee/:empCode/absent-detail', require('./absentDetail.router'));
router.use('/project/:projectId/attendance-data/', require('./processAttendanceRecords.router'))
router.use('/project/:projectId/wage-month', require('./wageMonth.router'))
router.use('/project/:projectId/attendance-status/', require('./displayAttendanceData.router'))
router.use('/project/:projectId/month-end/', require('./processMonthEnd.router'))
router.use('/project/:projectId/todays-attendance', require('./todaysAttendance.router'))
router.use('/project/:projectId/employee-dashboard', require('./employeeDashboard.router'));

module.exports = router