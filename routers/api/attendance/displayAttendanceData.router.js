const router = require("express").Router({ mergeParams: true });
const empWiseRosterModel = require("../../../model/attendance/employeeWiseRoster.model");
const shiftModel = require("../../../model/attendance/shift.model");
const holidayModel = require("../../../model/shared/holiday.model");
const genWorkDayModel = require("../../../model/attendance/generalWorkingDay.model");
const absentDetailModel = require("../../../model/attendance/absentDetail.model");
const leaveTypeModel = require("../../../model/shared/leaveType.model");
const dtHelper = require("./functions/dateTimeHelper");
const Op = require("sequelize").Op;
const codes = require("../../../global/codes");

router.route("/employee/:empCode").get(async (req, res) => {
  try {
    const empCode = req.params.empCode;
    const fromDate = new Date(req.query.from_date);
    const toDate = new Date(req.query.to_date);

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
      day: { [Op.between]: [fromDate, toDate] },
      project_id: req.params.projectId
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
      include: [{ model: leaveTypeModel }]
    });

    console.log(absentDetails)

    // Get employee wise attendance status between fromDate and toDate
    const empWiseRosters = await empWiseRosterModel
      .findAll({
        include: [{ model: shiftModel }],
        where: {
          emp_code: empCode,
          project_id: req.params.projectId,
          day: { [Op.between]: [fromDate, toDate] }
          // attendance_status: { [Op.ne]: null }
        }
      })
      .map(empRoster => {
        let remarks, attendance_status;
        const in_time = empRoster.in_time;
        const out_time = empRoster.out_time;

        if (empRoster.shift.is_general) {
          if (holidaysArray.find(holiday => holiday.day === empRoster.day)) {
            remarks = holiday.name;
            attendance_status = codes.ATTENDANCE_HOLIDAY;
          }
          // Check if saturday and sunday is working day
          else if (
            dtHelper.isSundaySaturday(empRoster.day) &&
            genWorkDays.find(workDay => workDay.day === empRoster.day)
          ) {
            remarks = dtHelper.isSunday(empRoster.day) ? "SUNDAY" : "SATURDAY";
            attendance_status = codes.ATTENDANCE_HOLIDAY;
          } else {
            remarks = "";
            attendance_status = empRoster.attendance_status;
          }
        }

        if (!empRoster.shift.is_general) {
          // Check for off day
          if (codes.ATTENDANCE_OFF_DAY === empRoster.attendance_status) {
            remarks = "";
            attendance_status = empRoster.attendance_status;
          } else {
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
          remarks = absentDtl.leave_type.description;
          attendance_status = codes.ATTENDANCE_ON_LEAVE;
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
  } finally {
    // Code will be added later
  }
});

router.route("/employee").get(async (req, res) => {});

module.exports = router;
