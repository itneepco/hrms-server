const router = require("express").Router({ mergeParams: true });
const empWiseRosterModel = require("../../../model/attendance/employeeWiseRoster.model");
const shiftModel = require("../../../model/attendance/shift.model");
const punchRecModel = require("../../../model/attendance/punchingRec.model");
const wageMonthModel = require("../../../model/attendance/wageMonth.model");
const Op = require("sequelize").Op;
const moment = require("moment");
const dateTimeHelper = require("./functions/dateTimeHelper");
const attendanceTimingHelper = require("./functions/attendanceTimingHelper");
const codes = require('../../../global/codes');

router.route("/").get(async (req, res) => {
  try {
    const currentDate = new Date(req.query.day);

    //Get the wage month for the currentdate
    const currWageMonth = await wageMonthModel.findOne({
      where: {
        from_date: { [Op.lte]: currentDate },
        to_date: { [Op.gte]: currentDate }
      }
    });

    if (!currWageMonth) {
      return res.status(200).json({
        message: "Wage month corresponding to day does not exist",
        error: false,
        data: null
      });
    }

    if (
      !currWageMonth.shift_roster_status ||
      !currWageMonth.gen_roster_status
    ) {
      return res.status(200).json({
        message: "Employee wise roster not generated for the period",
        error: false,
        data: null
      });
    }

    // Get punching records for the currentDate
    const punchingRecords = await punchRecModel.findAll({
      where: {
        project_id: req.params.projectId,
        punching_date: { [Op.eq]: currentDate }
      }
    });

    // Get employee wise rosters for the currentDate
    const empWiseRosters = await empWiseRosterModel.findAll({
      where: {
        day: currentDate,
        project_id: req.params.projectId
      },
      include: [{ model: shiftModel }]
    });

    // Get array of emp_code having night shift on the currentDate
    const nightShiftEmployees = empWiseRosters
      .filter(roster => roster.shift.is_night_shift)
      .map(roster => roster.emp_code);

    // Get next day based on current date
    const nextDay = moment(currentDate)
      .add(1, "day")
      .toDate();

    //Get punching records for the next Day
    const PunchRecsNextDay = await punchRecModel.findAll({
      where: {
        project_id: req.params.projectId,
        punching_date: { [Op.eq]: nextDay },
        emp_code: { [Op.in]: nightShiftEmployees }
      }
    });

    // array to store the attendance objects for the currentDate
    let attendanceArray = [];

    empWiseRosters.forEach(empRoster => {
      // Find the shift for the current employee
      const shift = empRoster.shift;

      // Get the  scheduled times for shift
      const in_time_start = shift.in_time_start;
      const in_time_end = shift.in_time_end;
      const in_time_late = shift.int_time_late;
      const out_time_start = shift.out_time_start;
      const out_time_end = shift.out_time_end;

      // Variable to employee punching time
      let emp_in_time;
      let emp_out_time;

      // If off day for shift duty employee
      if (shift.in_time_start === shift.out_time_start) {
        return attendanceArray.push({
          day: currentDate,
          emp_code: empRoster.emp_code,
          // shift: shift.name,
          in_time: "",
          out_time: "",
          attendance_status: codes.ATTENDANCE_OFF_DAY
        });
      }

      //Calculate working hours as per roster
      const shift_working_hour = dateTimeHelper.getTimeInterval(
        out_time_start,
        in_time_start
      );

      // Variable to store punching Reocrds of the employee for the currentDate
      let empPunchData;

      // Filter out emp Punching data for the current employee from punchingRecords
      empPunchData = punchingRecords.filter(punchRec => {
        return punchRec.emp_code === empRoster.emp_code;
      });

      // Calculate in time
      emp_in_time = dateTimeHelper.getMinTime(empPunchData);
      if (emp_in_time === "") {
        return attendanceArray.push({
          day: currentDate,
          emp_code: empRoster.emp_code,
          // shift: shift.name,
          in_time: "",
          out_time: "",
          attendance_status: codes.ATTENDANCE_ABSENT
        });
      }

      // Calculate out time if night shift
      if (shift.is_night_shift) {
        // Filter out emp Punching data for the current employee from punchingRecords for Next Date
        let empPunchDataNextDay = PunchRecsNextDay.filter(punchRec => {
          return (
            punchRec.emp_code === empRoster.emp_code &&
            punchRec.punching_time <= out_time_end
          );
        });

        emp_out_time = dateTimeHelper.getMaxTime(empPunchDataNextDay);
        if (emp_out_time === "") {
          return attendanceArray.push({
            emp_code: empRoster.emp_code,           
            day: currentDate,           
            in_time: emp_in_time,
            out_time:"",
            attendance_status: codes.ATTENDANCE_ABSENT         
          });
        }
      } else {
        // Calculate out time if NOT night shift
        emp_out_time = dateTimeHelper.getMaxTime(empPunchData);
        if (emp_out_time === "") {
          return attendanceArray.push({
            emp_code: empRoster.emp_code,           
            day: currentDate,           
            in_time: emp_in_time,
            out_time:"",            
            attendance_status: codes.ATTENDANCE_ABSENT
          });
        }
      }

      const emp_punch_in_flag = attendanceTimingHelper.check_in_time(
        emp_in_time,
        in_time_start,
        in_time_end,
        in_time_late
      );

      // Calculate employee working hours
      const emp_working_hour = dateTimeHelper.getTimeInterval(
        emp_out_time,
        emp_in_time
      );

      // if worked less than half  of shift time
      if (emp_working_hour < shift_working_hour / 2) {
        return attendanceArray.push({
          day: currentDate,
          emp_code: empRoster.emp_code,
          // shift: shift.name,
          in_time: emp_in_time,
          out_time: emp_out_time,
          attendance_status: codes.ATTENDANCE_ABSENT
        });
      }

      // if punched befor roster in time window
      if (emp_punch_in_flag === 1) {
        return attendanceArray.push({
          day: currentDate,
          emp_code: empRoster.emp_code,
          // shift: shift.name,
          in_time: emp_in_time,
          out_time: emp_out_time,
          attendance_status: codes.ATTENDANCE_ABSENT
        });
      }

      const emp_punch_out_flag = attendanceTimingHelper.check_in_time(
        emp_out_time,
        out_time_start,
        out_time_end
      );

      // if punched after roster out time window closes
      if (emp_punch_out_flag === 2) {
        return attendanceArray.push({
          day: currentDate,
          emp_code: empRoster.emp_code,
          // shift: shift.name,
          in_time: emp_in_time,
          out_time: emp_out_time,
          attendance_status: codes.ATTENDANCE_ABSENT
        });
      }

      if (emp_punch_in_flag > 1) {
        // if punched before shift late in time
        if (emp_punch_in_flag === 3) {
          // If punched out before shift out time start
          if (emp_punch_out_flag === 1) {
            return attendanceArray.push({
              day: currentDate,
              emp_code: empRoster.emp_code,
              // shift: shift.name,
              in_time: emp_in_time,
              out_time: emp_out_time,
              attendance_status: codes.ATTENDANCE_HALF_DAY
            });
          }
          // If punched out within shift out time window
          if (emp_punch_out_flag === 0) {
            if (emp_working_hour >= shift_working_hour) {
              return attendanceArray.push({
                day: currentDate,
                emp_code: empRoster.emp_code,
                // shift: shift.name,
                in_time: emp_in_time,
                out_time: emp_out_time,
                attendance_status: codes.ATTENDANCE_LATE
              });
            }
            return attendanceArray.push({
              day: currentDate,
              emp_code: empRoster.emp_code,
              // shift: shift.name,
              in_time: emp_in_time,
              out_time: emp_out_time,
              attendance_status: codes.ATTENDANCE_HALF_DAY
            });
          }
        }

        // if punched after shift late in time
        if (emp_punch_in_flag === 2) {
          return attendanceArray.push({
            day: currentDate,
            emp_code: empRoster.emp_code,
            // shift: shift.name,
            in_time: emp_in_time,
            out_time: emp_out_time,
            attendance_status: codes.ATTENDANCE_HALF_DAY
          });
        }
      }

      //if punched within shift in time window
      if (emp_punch_in_flag === 0) {
        // If punched out before shift out time start
        if (emp_punch_out_flag === 1) {
          return attendanceArray.push({
            day: currentDate,
            emp_code: empRoster.emp_code,
            // shift: shift.name,
            in_time: emp_in_time,
            out_time: emp_out_time,
            attendance_status: codes.ATTENDANCE_HALF_DAY
          });
        }

        // If punched out within shift out time window
        if (emp_punch_out_flag === 0) {
          if (emp_working_hour >= shift_working_hour) {
            return attendanceArray.push({
              day: currentDate,
              emp_code: empRoster.emp_code,
              // shift: shift.name,
              in_time: emp_in_time,
              out_time: emp_out_time,
              attendance_status:codes.ATTENDANCE_PRESENT
            });
          }
          return attendanceArray.push({
            day: currentDate,
            emp_code: empRoster.emp_code,
            // shift: shift.name,
            in_time: emp_in_time,
            out_time: emp_out_time,
            attendance_status: codes.ATTENDANCE_HALF_DAY
          });
        }
      }
    }); //End of forEach loop

    console.log(attendanceArray);
     
    //attendanceArray.forEach()

    // const result = await empWiseRosterModel.bulkCreate(attendanceArray,{
    //   updateOnDuplicate: ["in_time", "out_time", "attendance_status"]
    // })   

    res.status(200)
      .json({ message: "SUCCESS", error: false, data: result });

  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: `Error:: ${error.name}`, error: true, data: null });
  }
});

function insertEmpWiseRoster(dataArray){
  
}

module.exports = router;
