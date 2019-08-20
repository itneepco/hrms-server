const router = require("express").Router({ mergeParams: true });
const empWiseRosterModel = require("../../../model/attendance/employeeWiseRoster.model");
const genRosterModel = require('../../../model/attendance/generalRoster.model')
const shiftModel = require("../../../model/attendance/shift.model");
const groupModel = require("../../../model/attendance/group.model");
const punchingRecordModel = require("../../../model/attendance/punchingRec.model");
const wageMonthModel = require("../../../model/attendance/wageMonth.model");
const employeeGroupModel = require("../../../model/attendance/employeeGroup.model");
const dtHelper = require("./functions/dateTimeHelper");
const Op = require("sequelize").Op;
const codes = require("../../../global/codes");

router.route("/:empCode/punch-timings").get(async (req, res) => {
  try {
    const employeeGroupDetails = await employeeGroupModel.findOne({
      where: { emp_code: req.params.empCode },
      include: [
        {model: groupModel, as: 'group'},
      ]
    });

    const group = employeeGroupDetails.group;
    if(group.is_general) {
      // If general group | Join general_roster table with shift
      const roster = await genRosterModel.findOne({
        where: {group_id: group.id},
        include: [{ model: shiftModel, as: 'shift'}]
      });
      res.status(200).json([roster.shift]);

    } else {
      const shifts = await shiftModel.findAll({
        where: {
          project_id: req.params.projectId,
          is_general: false
        }
      })
      res.status(200).json(shifts.filter(shift => shift.working_hours > 0));
    }
  } catch (error) {
    console.error("Error : " + error);
    res
      .status(500)
      .json({ message: `Error:: ${error}`, error: true, data: null });
  }
});

router.route("/:empCode/todays-punching").get(async (req, res) => {

  try {

    console.log('BODY : ' + req.body);

    const punchingRecords = await punchingRecordModel.findAll({
      where: {
        emp_code: req.params.empCode,
        punching_date: dtHelper.getTodaysDate(),
        project_id: req.params.projectId
      }
    });

    res
      .status(200)
      .json(punchingRecords.map(record => record.punching_time));
  } catch (error) {
    console.error("Error : " + error);
    res
      .status(500)
      .json({ message: `Error:: ${error}`, error: true, data: null });
  }

});

router.route("/:empCode/late-punchings").get(async (req, res) => {
  try {

    // Fetch the current wage month
    const currWageMonth = await wageMonthModel.findOne({
      where: {
        project_id: req.params.projectId,
        status: codes.WAGE_MONTH_ACTIVE
      }
    });

    // If current wage month does not exist, return error
    if (!currWageMonth) {
      return res.status(200).json({
        message: "Wage month corresponding to day does not exist",
        error: false,
        data: null
      });
    }

    // Fetch data from employee_wise_roster between start date and end date of the current wage month
    // for a single employee
    const empWiseRosters = await empWiseRosterModel.findAll({
      where: {
        emp_code: req.params.empCode,
        day: {
          [Op.between]: [currWageMonth.from_date, currWageMonth.to_date]
        },
        project_id: req.params.projectId,
        attendance_status: codes.ATTENDANCE_LATE
      },
    });

    res
      .status(200)
      .json(empWiseRosters.map(roster => roster.day));

  } catch (error) {
    console.error("Error : " + error);
    res
      .status(500)
      .json({ message: `Error:: ${error}`, error: true, data: null });
  }
});

module.exports = router;