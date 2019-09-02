const router = require("express").Router();
const validateTimeOfficer = require("../../../middlewares/validateTimeOfficer");
const validateEmpProject = require("../../../middlewares/validateEmployeeProject");

// Validate if current user belongs to projectId
router.use("/project/:projectId/", validateEmpProject);

// For Time Officer
router.use(
  "/project/:projectId/groups",
  validateTimeOfficer,
  require("./group.router")
);
router.use(
  "/project/:projectId/shifts",
  validateTimeOfficer,
  require("./shift.router")
);
router.use(
  "/project/:projectId/emp-group",
  validateTimeOfficer,
  require("./employeeGroup.router")
);
router.use(
  "/project/:projectId/shift-roster",
  validateTimeOfficer,
  require("./shiftRoster.router")
);
router.use(
  "/project/:projectId/working-day",
  validateTimeOfficer,
  require("./generalWorkingDay.router")
);
router.use(
  "/project/:projectId/general-roster",
  validateTimeOfficer,
  require("./generalRoster.router")
);
router.use(
  "/project/:projectId/attendance-data/upload",
  validateTimeOfficer,
  require("./uploadAttendanceData.router")
);
router.use(
  "/project/:projectId/emp-wise-roster",
  validateTimeOfficer,
  require("./empWiseRoster.router")
);
router.use(
  "/project/:projectId/employee/:empCode/absent-detail",
  validateTimeOfficer,
  require("./absentDetail.router")
);
router.use(
  "/project/:projectId/attendance-data/",
  validateTimeOfficer,
  require("./processAttendanceRecords.router")
);
router.use(
  "/project/:projectId/month-end/",
  validateTimeOfficer,
  require("./processMonthEnd.router")
);

router.use(
  "/project/:projectId/graph-dashboard/",
  validateTimeOfficer,
  require("./graphDashboard.router")
);

// For Employee
router.use(
  "/project/:projectId/attendance-status/",
  require("./displayAttendanceData.router")
);
router.use(
  "/project/:projectId/wage-month",
  require("./wageMonth.router")
);
router.use(
  "/project/:projectId/employee-dashboard",
  require("./employeeDashboard.router")
);

module.exports = router;
