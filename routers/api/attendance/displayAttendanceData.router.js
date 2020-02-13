const router = require("express").Router({ mergeParams: true });
const empWiseRosterModel = require("../../../model/attendance/employeeWiseRoster.model");
const shiftModel = require("../../../model/attendance/shift.model");
const holidayModel = require("../../../model/shared/holiday.model");
const genWorkDayModel = require("../../../model/attendance/generalWorkingDay.model");
const absentDetailModel = require("../../../model/attendance/absentDetail.model");
const leaveTypeModel = require("../../../model/shared/leaveType.model");
const empGroupModel = require('../../../model/attendance/employeeGroup.model');
const dtHelper = require("./functions/dateTimeHelper");
const Op = require("sequelize").Op;
const codes = require("../../../global/codes");

router.route("/employee/:empCode").get(async (req, res) => {
  try {
    const empCode = req.params.empCode;
    const fromDate = new Date(req.query.from_date);
    const toDate = new Date(req.query.to_date);
    let late_count = 0;

    // Get holidays for the wagemonth
    const holidaysArray = await holidayModel.findAll({
      where: {
        day: { [Op.between]: [fromDate, toDate] },
        type: { [Op.eq]: "CH" },
        project_id: req.params.projectId
      }
    });

    // Get list of general working days
    const genWorkDays = await genWorkDayModel.findAll({
      where: {
        day: { [Op.between]: [fromDate, toDate] },
        project_id: req.params.projectId
      }
    });

    // Get absent details
    // Fetch absent details
    const absentDetails = await absentDetailModel.findAll({
      where: {
        [Op.or]: [
          {
            from_date: {
              [Op.between]: [fromDate, toDate]
            }
          },
          {
            to_date: {
              [Op.between]: [fromDate, toDate]
            }
          }
        ],
        project_id: req.params.projectId
      },
      include: [{ model: leaveTypeModel, as: "leaveType" }]
    });

    // For checking if current employee is exempted from punching
    const empPunchGroup = await empGroupModel.findOne({
      where: { emp_code: empCode }
    })

    // Get employee wise attendance status between fromDate and toDate
    const empWiseRosters = await empWiseRosterModel
      .findAll({
        include: [{ model: shiftModel }],
        where: {
          emp_code: empCode,
          project_id: req.params.projectId,
          day: { [Op.between]: [fromDate, toDate] }
          // attendance_status: { [Op.ne]: null }
        },
        order: [
          ['emp_code', 'ASC'],
          ['day', 'ASC'],
        ],
      })
      .map(empRoster => {

        let remarks, attendance_status;
        const in_time = empRoster.in_time ? empRoster.in_time : '--';
        const out_time = empRoster.out_time ? empRoster.out_time : '--';

        // if current employee is not exempted from punching
        if (empPunchGroup) {
          // Remarks and status according to processed attendance data
          remarks = empRoster.remarks;
          attendance_status = empRoster.attendance_status;

          // If it is a holiday
          const holiday = holidaysArray.find(holiday => holiday.day === empRoster.day)
          if (holiday) {
            remarks = remarks ? remarks : holiday.name;
            if (empRoster.shift.is_general) {
              attendance_status = codes.ATTENDANCE_HOLIDAY;
            }
          }

          if (empRoster.shift.is_general) {
            // Check if saturday and sunday is working day
            if (
              dtHelper.isSundaySaturday(empRoster.day) &&
              !genWorkDays.find(workDay => workDay.day === empRoster.day)
            ) {
              remarks = dtHelper.isSunday(empRoster.day) ? "SUNDAY" : "SATURDAY";
              attendance_status = codes.ATTENDANCE_HOLIDAY;
            }
          }
          else {
            // Check for off day for shift duty employee
            if (codes.ATTENDANCE_OFF_DAY === empRoster.attendance_status) {
              remarks = "";
              attendance_status = empRoster.attendance_status;
            }
          }

          // Check for applied leaves
          const absentDtl = absentDetails.find(absentDetail => {
            return (
              absentDetail.emp_code === empRoster.emp_code &&
              dtHelper.compareDate(empRoster.day, absentDetail.from_date) >= 0 &&
              dtHelper.compareDate(empRoster.day, absentDetail.to_date) <= 0
            );
          });

          if (absentDtl) {
            remarks = absentDtl.leaveType.description;
            attendance_status = codes.ATTENDANCE_ABSENT_OFFICIALLY;

            // Set the late_count to 0 if employee has applied for any 
            // leave (except Half Day CL) on the 5th day the employee is late
            if (empRoster.attendance_status == codes.ATTENDANCE_LATE &&
              late_count == 4 && absentDtl.leave_code != codes.HD_CL_CODE) {
              late_count = 0
            }
          }

          // Check for 5 days late and set the status accordingly
          if (empRoster.attendance_status == codes.ATTENDANCE_LATE && !empRoster.modified_status) {
            late_count++

            // If absent for 5 days set attendance status to 5D_LATE and late_count to 0
            if (late_count == 5) {
              remarks = remarks ? remarks : "5 days late"
              attendance_status = codes.ATTENDANCE_5D_LATE
              late_count = 0
            }
          }
        }

        // if employee is exempted from punching
        else {
          remarks = 'EXEMPTED'
          attendance_status = codes.ATTENDANCE_EXEMPTED
        }

        return Object.assign(
          {},
          {
            id: empRoster.id,
            day: empRoster.day,
            emp_code: empRoster.emp_code,
            shift: {
              id: empRoster.shift.id,
              name: empRoster.shift.name,
              is_general: empRoster.shift.is_general
            },
            in_time: in_time,
            out_time: out_time,
            attendance_status: attendance_status,
            modified_status: empRoster.modified_status,
            remarks: remarks
          }
        );
      });

    res.status(200).json(empWiseRosters);
  } catch (err) {
    console.log("Error : " + err);
  }
});

router.route("/employee").get(async (req, res) => { });

module.exports = router;
