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
  const currentDate = "2019-06-19";
  let attendance_status = "";

  try {
    // const shiftTimings = await shiftModel.findAll({
    //   where: {
    //     project_id: req.params.projectId
    //   }
    // });

    const empWiseRosters = await empWiseRosterModel.findAll({
      where: {
        day: currentDate,
        project_id: req.params.projectId
      },
      include: [{ model: shiftModel }]
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

    // Process empployee punching records
    employeeGroups.forEach(empGroup => {
      // Find employee roster for day=currentDate
      const emp_roster = empWiseRosters.find(
        roster => roster.emp_code == empGroup.emp_code
      );
      if (!emp_roster) return;

      // Find the shift for the current employee and for the day=currentDate
      const shift = emp_roster.shift;

      // Get the shift punch time in Date() format
      const in_start_date = get_date_object(currentDate, shift.in_time_start);
      const in_end_date = get_date_object(currentDate, shift.in_time_end);
      const late_time_date = get_date_object(currentDate, shift.late_time);
      // const half_time_date = get_date_object(currentDate, shift.half_time);
      const out_start_date = get_date_object(currentDate, shift.out_time_start);
      const out_end_date = get_date_object(currentDate, shift.out_time_end);

      //Calculate working hours for the shift
      const working_hour =
        (out_start_date.getTime() - in_start_date.getTime()) / 3600000;

      const punchData = punchingRecords.filter(
        punchRec => punchRec.emp_code === empGroup.emp_code
      );

      if (punchData.length <= 1) {
        attendance_status = "ABSENT";
        console.log({
          day: currentDate,
          emp: empGroup.emp_code,
          shift: shift.name,
          in_time: punchData[0],
          out_time: '',
          attendance_status
        });
        return;
      }

      // Calculation of in time
      const in_time = punchData.reduce(function(prev, current) {
        return prev.punching_time < current.punching_time ? prev : current;
      }).punching_time;

      // In time in date format
      const in_time_date = get_date_object(currentDate, in_time);
      
      // Calculation of out time
      const out_time = punchData.reduce(function(prev, current) {
        return prev.punching_time > current.punching_time ? prev : current;
      }).punching_time;

      //Out time in date format
      const out_time_date = get_date_object(currentDate, out_time);

      // calculate hours served by the current employee
      const emp_hours_served =
        (out_time_date.getTime() - in_time_date.getTime()) / 3600000;

      // if in time is between in time window
      if (in_time_date >= in_start_date && in_time_date <= in_end_date) {
        // if out time is between out time window
        if (out_time_date >= out_start_date && out_time_date <= out_end_date) {
          // if hours served by employee is greater or equal to working hour
          if (emp_hours_served >= working_hour) {
            attendance_status = "PRESENT";
          } else {
            attendance_status = "HALF DAY";
          }
        }
        // if out_time is before out time starts
        else if (out_time_date < out_start_date) {
          // if hours served by employee is greater or equal to half of working hour
          if (emp_hours_served >= working_hour / 2) {
            attendance_status = "HALF DAY";
          } else {
            attendance_status = "ABSENT";
          }
        } else {
          attendance_status = "ABSENT";
        }
      }
      // if in time is between in time end and late time
      else if (in_time_date > in_end_date && in_time_date <= late_time_date) {
        // if out time is between out time window
        if (out_time_date >= out_start_date && out_time_date <= out_end_date) {
          // if hours served by employee is greater or equal to working hour
          if (emp_hours_served >= working_hour) {
            attendance_status = "LATE PRESENT";
          } else {
            attendance_status = "HALF DAY";
          }
        }
        // if out_time is before out time starts
        else if (out_time_date < out_start_date) {
          // if hours served by employee is greater or equal to half of working hour
          if (emp_hours_served >= working_hour / 2) {
            attendance_status = "HALF DAY";
          } else {
            attendance_status = "ABSENT";
          }
        } else {
          attendance_status = "ABSENT";
        }
      }
      // if in_time is after late time but before out start time
      else if (
        in_time_date > late_time_date &&
        in_time_date <= out_start_date
      ) {
        // if out time is between out time window
        if (out_time_date >= out_start_date && out_time_date <= out_end_date) {
          // if hours served by employee is greater or equal to half of working hour
          if (emp_hours_served >= working_hour / 2) {
            attendance_status = "HALF DAY";
          } else {
            attendance_status = "ABSENT";
          }
        }  
        else {
          attendance_status = "ABSENT";
        }
      } else {
        attendance_status = "ABSENT";
      }

      console.log({
        day: currentDate,
        emp: empGroup.emp_code,
        in_time,
        out_time,
        emp_hours_served,
        working_hour,
        shift: shift.name,
        attendance_status
      });
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
