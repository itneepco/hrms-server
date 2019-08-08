const router = require("express").Router({ mergeParams: true });
const empWiseRosterModel = require("../../../model/attendance/employeeWiseRoster.model");
const holidayModel = require("../../../model/shared/holiday.model");
const shiftModel = require("../../../model/attendance/shift.model");
const punchRecModel = require("../../../model/attendance/punchingRec.model");
const wageMonthModel = require("../../../model/attendance/wageMonth.model");
const groupModel = require("../../../model/attendance/group.model");
const Op = require("sequelize").Op;
const moment = require("moment");

router.route("/").get(async (req, res) => {
  let attendance_status = "";
  try {
    const currentDate = new Date(req.query.day);

    const currWageMonth = await wageMonthModel.findOne({
      where: {
        from_date: { [Op.lte]: currentDate },
        to_date: { [Op.gte]: currentDate }
      }
    });

    if (!currWageMonth) {
      return res
        .status(200)
        .json({ message: "Wage month does not exist for that period" });
    }

    if (
      !currWageMonth.shift_roster_status ||
      !currWageMonth.gen_roster_status
    ) {
      return res
        .status(200)
        .json({ message: "Employee wise roster not generated for the period" });
    }

    const empWiseRosters = await empWiseRosterModel.findAll({
      where: {
        day: currentDate,
        project_id: req.params.projectId
      },
      include: [{ model: shiftModel }]
    });
    

    // Array of employee_code of those employee who are doing night shift
    const nightShiftEmployees = empWiseRosters
      .filter(roster => roster.shift.is_night_shift)
      .map(roster => roster.emp_code);

    // Get punching records for the current day
    const punchingRecords = await punchRecModel.findAll({
      where: {
        project_id: req.params.projectId,
        punching_date: { [Op.eq]: currentDate }
      }
    });   

    // Get next day based on current date
    const nextDay = moment(currentDate).add(1, "day").toDate();
    
    
    //Get next day punching records
    const nexDayPunchRecs = await punchRecModel.findAll({
      where: {
        project_id: req.params.projectId,
        punching_date: { [Op.eq]: nextDay },
        emp_code: { [Op.in]: nightShiftEmployees }
      }
    });   

    ///////////////////////////////////////////////////////////////////////
    /* Process attendance data for each employees by iterating employee wise roster */
    ////////////////////////////////////////////////////////////////////////

    let attendanceArray = [];
    empWiseRosters.forEach(empRoster => {
      // Find the shift for the current employee
      const shift = empRoster.shift;

      // Get the shift punch time in Date() format
      const in_start_date = get_date_object(currentDate, shift.in_time_start);
      const in_end_date = get_date_object(currentDate, shift.in_time_end);
      const late_time_date = get_date_object(currentDate, shift.late_time);

      // Calculate out start date and out end date
      let out_start_date;
      let out_end_date;

      if (shift.is_night_shift) {
        out_start_date = get_date_object(nextDay, shift.out_time_start);
        out_end_date = get_date_object(nextDay, shift.out_time_end);
      } else {
        out_start_date = get_date_object(currentDate, shift.out_time_start);
        out_end_date = get_date_object(currentDate, shift.out_time_end);
      }

       // If off day for shift duty employee
       if (shift.in_time_start === shift.out_time_start) {
        return attendanceArray.push({
          day: currentDate,
          emp: empRoster.emp_code,
          shift: shift.name,
          in_time: "",
          out_time: "",
          attendance_status: "OFF"
        });
      }

      //Calculate working hours for the shift
      const working_hour =
        (out_start_date.getTime() - in_start_date.getTime()) / 3600000;


      // Todo:--store in_time and out_time before filtering


     // Filter punching records based on in and out time window and emloyee code
      let empPunchData;
      if (shift.is_night_shift) {
        empPunchData = punchingRecords.filter(punchRec => {
          return (
            punchRec.emp_code === empRoster.emp_code &&
            punchRec.punching_time >= shift.in_time_start
          );
        });
      } else {
        empPunchData = punchingRecords.filter(punchRec => {
          return (
            punchRec.emp_code === empRoster.emp_code &&
            punchRec.punching_time >= shift.in_time_start &&
            punchRec.punching_time <= shift.out_time_end
          );
        });
      }

      if (
        (empPunchData.length <= 1 && !shift.is_night_shift) ||
        (empPunchData.length < 1 && shift.is_night_shift)
      ) {
        let attendance_status = "ABSENT";
        let in_time =
          empPunchData.length == 1 ? empPunchData[0].punching_time : "";

        return attendanceArray.push({
          day: currentDate,
          emp: empRoster.emp_code,
          shift: shift.name,
          in_time: in_time,
          out_time: "",
          attendance_status
        });
      }

      let in_time;
      if (empPunchData.length === 1 && shift.is_night_shift) {
        in_time = empPunchData[0].punching_time;
      } else {
        // For 2 or more punching records for the employee for current day
        // Calculate in time by taking the first punching rec
        in_time = empPunchData.reduce(function(prev, current) {
          return prev.punching_time < current.punching_time ? prev : current;
        }).punching_time;
      }

      const in_time_date = get_date_object(currentDate, in_time); // In time in date format

      // Calculation of out time
      let out_time_date;
      //if night duty get next day punching records
      if (shift.is_night_shift) {
        let empNextDayPunchData = nexDayPunchRecs.filter(nextDayPunch => {
          return nextDayPunch.emp_code === empRoster.emp_code;
        });

        out_time_filter = empNextDayPunchData.filter(
          punchData => punchData.punching_time <= shift.out_time_end
        );

        if (out_time_filter.length < 1) {
          return attendanceArray.push({
            day: currentDate,
            emp_code: empRoster.emp_code,
            shift: shift.name,
            in_time: in_time,
            out_time: "",
            attendance_status: "ABSENT"
          });
        }
        out_time = out_time_filter.reduce(function(prev, current) {
          return prev.punching_time > current.punching_time ? prev : current;
        }).punching_time;

        out_time_date = get_date_object(nextDay, out_time);
      } else {
        out_time = empPunchData.reduce(function(prev, current) {
          return prev.punching_time > current.punching_time ? prev : current;
        }).punching_time;

        out_time_date = get_date_object(currentDate, out_time);
      }

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
        } else {
          attendance_status = "ABSENT";
        }
      } else {
        attendance_status = "ABSENT";
      }

      attendanceArray.push({
        day: currentDate,
        emp: empRoster.emp_code,
        in_time,
        out_time,
        emp_hours_served,
        working_hour,
        shift: shift.name,
        attendance_status
      });
    });
    console.log(attendanceArray);
    res.status(200).json({ message: "OK", data: attendanceArray });
  } catch (error) {
    console.log(error);
  }
});

function get_date_object(day, time) {
  let date = moment(day).format("YYYY-MM-DD");

  return new Date(`${date} ${time}`);
}

module.exports = router;
