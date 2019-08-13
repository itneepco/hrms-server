const router             = require("express").Router({ mergeParams: true });
const empWiseRosterModel = require("../../../model/attendance/employeeWiseRoster.model");
const wageMonthModel     = require("../../../model/attendance/wageMonth.model");
const holidayModel       = require("../../../model/shared/holiday.model");
const absentDetailModel  = require("../../../model/attendance/absentDetail.model");
const shiftModel         = require("../../../model/attendance/shift.model");
const dateTimeHelper     = require("./functions/dateTimeHelper");
const codes              = require("../../../global/codes");
const Op                 = require("sequelize").Op;

router.route("/").get(async (req, res) => {
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

    // To do: Check whether punching records for the employess have been processed for each day
    // in the current wage month

    // Fetch data from employee_wise_roster between start date and end date of the current wage month
    const empWiseRosters = await empWiseRosterModel.findAll({
      where: {
        day: { [Op.between]: [currWageMonth.from_date, currWageMonth.to_date] },
        project_id: req.params.projectId
      }
    });

    // Fetch holiday details for the current wage  month
    const holidays = await holidayModel.findAll({
      where: {
        day: { [Op.between]: [currWageMonth.from_date, currWageMonth.to_date] },
        project_id: req.params.projectId,
        type: {[Op.eq]: 'CH'}
      }
    });

    // Fetch absent details
    const absentDetails = await absentDetailModel.findAll({
      where: {
        [Op.or]: [
          {
            from_date: {
              [Op.between]: [currWageMonth.from_date, currWageMonth.to_date]
            }
          },
          {
            to_date: {
              [Op.between]: [currWageMonth.from_date, currWageMonth.to_date]
            }
          }
        ],
        project_id: req.params.projectId
      }
    });

    let records = {};

    empWiseRosters.forEach(empRoster => {

      if (records[empRoster.emp_code] === undefined) {
        records[empRoster.emp_code] = {
          absent_days: [],
          holiday: []
        };
      }

      let attendance_status = empRoster.attendance_status;

      if (attendance_status === codes.ATTENDANCE_ABSENT || !attendance_status) {
        
        // Employee is absent in a holiday
        if (holidays.find(holiday => holiday.day === empRoster.day)) {
          return;
        }

        if (dateTimeHelper.isSundaySaturday(empRoster.day))  return;

        // Employess is absent with leave applied
        const absentDtl = absentDetails.find(absentDetail => {

          return (
            absentDetail.emp_code === empRoster.emp_code &&
            dateTimeHelper.compareDate(empRoster.day, absentDetail.from_date) >= 0 &&
            dateTimeHelper.compareDate(empRoster.day, absentDetail.to_date) <= 0
          );
        });

        if(!absentDtl) {
          records[empRoster.emp_code].absent_days.push(empRoster.day);
          
        } else {
          console.log('Employee '+empRoster.emp_code + ' has leave on ' + empRoster.day+ '\n');
        }
      }
    });

    console.log(records);

    res.status(200).json(records['006368']);
  } catch (error) {
    console.error("Error : " + error);
    res
      .status(500)
      .json({ message: `Error:: ${error.name}`, error: true, data: null });
  } finally {
  }
});

module.exports = router;
