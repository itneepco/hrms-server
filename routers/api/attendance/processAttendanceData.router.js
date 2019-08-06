const router = require("express").Router({ mergeParams: true });
const empWiseRosterModel = require("../../../model/attendance/employeeWiseRoster.model");
const empGroupModel = require("../../../model/attendance/employeeGroup.model");
const holidayModel = require("../../../model/shared/holiday.model");
const shiftModel = require("../../../model/attendance/shift.model");
const employeeModel = require("../../../model/shared/employee.model");
const genRosterModel = require("../../../model/attendance/generalRoster.model");
const punchRecModel = require("../../../model/attendance/punchingRec.model");
const groupModel = require("../../../model/attendance/group.model");
const Op = require("sequelize").Op;

router.route("/month-end").get((req, res) => {});

router.route("/insert").get(async (req, res) => {
  const currentDate = "2019-06-17";

  try {
    const shiftTimings = await shiftModel.findAll({
      where: {
        project_id: req.params.projectId
      }
    });

    const empWiseRosters = await empWiseRosterModel.findAll({
      where: {
        day: currentDate,
        project_id: req.params.projectId,
        // include: [{ model: shiftModel }]
      }
    });

    const employeeGroups = await empGroupModel.findAll({
      include: [
        {
          model: groupModel,
          as: "group",
          attributes: [],
          where: {
            project_id: req.params.projectId
          }
        }
      ]
    });

    const punchingRecords = await punchRecModel.findAll({
      where: {
        project_id: req.params.projectId,
        punching_date: { [Op.eq]: currentDate }
      }
    });

    employeeGroups.forEach(empGroup => {
      const punchData = punchingRecords.filter(
        punchRec => punchRec.emp_code === empGroup.emp_code
      );

      if (punchData.length < 1) {
        console.log("FDA", empGroup.emp_code);
        attendance_status = "FDA";
        return;
      }

      const out_time = punchData.reduce(function(prev, current) {
        return prev.punching_time > current.punching_time ? prev : current;
      }).punching_time; //returns object

      //const out_time_date = new Date(`${currentDate} ${out_time}`);
      const out_time_date = get_date_object(currentDate, out_time);

      const in_time = punchData.reduce(function(prev, current) {
        return prev.punching_time < current.punching_time ? prev : current;
      }).punching_time;

      //const in_time_date = new Date(`${currentDate} ${in_time}`);
      const in_time_date = get_date_object(currentDate, in_time);

      const empShift = empWiseRosters.find(
        empShift => (empShift.emp_code === empGroup.emp_code)
      );

      if (empShift) {
        /*
        if (in_time >= empShift.shift.in_time_start && in_time <= empShift.shift.in_time_end) {
          if ( out_time >= empShift.shift.out_time_start && out_time <= empShift.shift.out_time_end ) {

          } else {

          }
        } else {

        }
        */
        let status_object = {};
        let working_hour = 8;

        status_object.hours_served = out_time_date.getHours() - in_time_date.getHours();
        const shift = shiftTimings.find(shift => shift.id === empShift.shift_id);

        const in_start_date = get_date_object(currentDate, shift.in_time_start);
        const in_end_date = get_date_object(currentDate, shift.in_time_end);

        const late_time_date = get_date_object(currentDate, shift.late_time);

        const half_time_date = get_date_object(currentDate, shift.half_time);

        const out_start_date = get_date_object(
          currentDate,
          shift.out_time_start
        );

        const out_end_date = get_date_object(currentDate, shift.out_time_end);

        if (in_time_date >= in_start_date && in_time_date <= in_end_date) {
          status_object.in_time_ok = true;
          status_object.late_time_ok = false;
        } else if (
          in_time_date > in_end_date &&
          in_time_date <= late_time_date
        ) {
          status_object.in_time_ok = false;
          status_object.late_time_ok = true;
        } else {
          status_object.in_time_ok = false;
          status_object.late_time_ok = false;
        }

        if (out_time_date >= out_start_date && out_time_date <= out_end_date) {
          status_object.out_time_ok = true;
        } else {
          status_object.out_time_ok = false;
        }

        if (
          status_object.in_time_ok &&
          status_object.out_time_ok //&&
          //status_object.hours_served >= working_hour
        ) {
          status_object.attendance_status = "PRESENT";
        } else if (
          !status_object.in_time_ok &&
          status_object.late_time_ok &&
          status_object.out_time_ok //&&
          //status_object.hours_served >= working_hour
        ) {
          status_object.attendance_status = "LATE PRESENT";
        } else {
          status_object.attendance_status = "FDA";
        }
        attendance_status = status_object.attendance_status;
        console.log({
          emp: empGroup.emp_code,
          in_time,
          out_time,
          status_object,
          shift
        });
        console.log();
      } else {
        // General shift
        console.log("General Shift")
        console.log(empGroup.emp_code)
      }
    });
    res.status(200).json({ message: "OK", data: empWiseRosters });
    
  } catch (error) {
    console.log(error);
  }
});

function get_date_object(day, time) {
  return new Date(`${day} ${time}`);
}

module.exports = router;
