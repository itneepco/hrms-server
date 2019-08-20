const dateTimeHelper = require("./dateTimeHelper");
const attendanceTimingHelper = require("./attendanceTimingHelper");
const codes = require("../../../../global/codes");

function processPunchData(empRoster, punchingRecords, punchRecsNextDay, currentDate) {
  // Find the shift for the current employee
  const shift = empRoster.shift;

  // Get the  scheduled times for shift
  const in_time_start = shift.in_time_start;
  const in_time_end = shift.in_time_end;
  const in_time_late = shift.late_time;
  const out_time_start = shift.out_time_start;
  const out_time_end = shift.out_time_end;
  //Retrieve shift working hours as per roster
  const shift_working_hour = shift.working_hours;

  // Variable to employee punching time
  let emp_in_time;
  let emp_out_time;

  // If off day for shift duty employee
  if (shift_working_hour == 0) {
    return {
      day: currentDate,
      emp_code: empRoster.emp_code,
      // shift: shift.name,
      in_time: null,
      out_time: null,
      attendance_status: codes.ATTENDANCE_OFF_DAY
    };
  }

  // Variable to store punching Reocrds of the employee for the currentDate
  let empPunchData;

  // Filter out emp Punching data for the current employee from punchingRecords
  empPunchData = punchingRecords.filter(punchRec => {
    return punchRec.emp_code === empRoster.emp_code;
  });

  // Filter out punching data for Night Shift
  if (shift.is_night_shift) {
    empPunchData = empPunchData.filter(punchData => {
      const punchStartTime = dateTimeHelper.substractHours(shift.in_time_start, codes.SUBSTRACT_HOURS_FOR_NIGHT_SHIFT)
      return punchData.punching_time >= punchStartTime
    })
  }

  // Calculate in time
  emp_in_time = dateTimeHelper.getMinTime(empPunchData);
  if (emp_in_time === "") {
    return {
      day: currentDate,
      emp_code: empRoster.emp_code,
      // shift: shift.name,
      in_time: null,
      out_time: null,
      attendance_status: codes.ATTENDANCE_ABSENT
    };
  }

  // Calculate out time if night shift
  if (shift.is_night_shift) {
    // Filter out emp Punching data for the current employee from punchingRecords for Next Date
    let empPunchDataNextDay = punchRecsNextDay.filter(punchRec => {
      return (
        punchRec.emp_code === empRoster.emp_code &&
        punchRec.punching_time <= out_time_end
      );
    });

    emp_out_time = dateTimeHelper.getMaxTime(empPunchDataNextDay);
    if (emp_out_time === "") {
      return {
        emp_code: empRoster.emp_code,
        day: currentDate,
        in_time: emp_in_time,
        out_time: null,
        attendance_status: codes.ATTENDANCE_ABSENT
      };
    }
  } else {
    // Calculate out time if NOT night shift
    emp_out_time = dateTimeHelper.getMaxTime(empPunchData);
    if (emp_out_time === "") {
      return {
        emp_code: empRoster.emp_code,
        day: currentDate,
        in_time: emp_in_time,
        out_time: null,
        attendance_status: codes.ATTENDANCE_ABSENT
      };
    }
  }

  // Calculate in time flag
  const emp_punch_in_flag = attendanceTimingHelper.check_in_time(
    emp_in_time,
    in_time_start,
    in_time_end,
    in_time_late
  );

  // Calculate out time flag
  const emp_punch_out_flag = attendanceTimingHelper.check_out_time(
    emp_out_time,
    out_time_start,
    out_time_end
  );

  // Calculate employee working hours
  const emp_working_hour = dateTimeHelper.getTimeInterval(
    emp_in_time,
    emp_out_time
  );

  // if(empRoster.emp_code === '005383') {
  //   console.log(
  //     '005383',
  //     emp_in_time,
  //     in_time_start,
  //     in_time_end,
  //     in_time_late,
  //     emp_working_hour,
  //     shift_working_hour)

  //   console.log("IN FLAG", emp_punch_in_flag)
  //   console.log("OUT FLAG", emp_punch_out_flag)
  // }

  // if worked less than half  of shift time
  if (emp_working_hour < shift_working_hour / 2) {
    return{
      day: currentDate,
      emp_code: empRoster.emp_code,
      // shift: shift.name,
      in_time: emp_in_time,
      out_time: emp_out_time,
      attendance_status: codes.ATTENDANCE_ABSENT
    };
  }

  // if punched befor roster in time window
  if (emp_punch_in_flag === 1) {
    return {
      day: currentDate,
      emp_code: empRoster.emp_code,
      // shift: shift.name,
      in_time: emp_in_time,
      out_time: emp_out_time,
      attendance_status: codes.ATTENDANCE_ABSENT
    };
  }

  // if punched after roster out time window closes
  if (emp_punch_out_flag === 2) {
    return {
      day: currentDate,
      emp_code: empRoster.emp_code,
      // shift: shift.name,
      in_time: emp_in_time,
      out_time: emp_out_time,
      attendance_status: codes.ATTENDANCE_ABSENT
    };
  }

  if (emp_punch_in_flag > 1) {
    
    // if punched before shift late in time
    if (emp_punch_in_flag === 3) {
      // If punched out before shift out time start
      if (emp_punch_out_flag === 1) {
        return {
          day: currentDate,
          emp_code: empRoster.emp_code,
          // shift: shift.name,
          in_time: emp_in_time,
          out_time: emp_out_time,
          attendance_status: codes.ATTENDANCE_HALF_DAY
        };
      }
      // If punched out within shift out time window
      if (emp_punch_out_flag === 0) {
        if (emp_working_hour >= shift_working_hour) {
          return {
            day: currentDate,
            emp_code: empRoster.emp_code,
            // shift: shift.name,
            in_time: emp_in_time,
            out_time: emp_out_time,
            attendance_status: codes.ATTENDANCE_LATE
          };
        }
        return {
          day: currentDate,
          emp_code: empRoster.emp_code,
          // shift: shift.name,
          in_time: emp_in_time,
          out_time: emp_out_time,
          attendance_status: codes.ATTENDANCE_HALF_DAY
        };
      }
    }

    // if punched after shift late in time
    if (emp_punch_in_flag === 2) {
      return {
        day: currentDate,
        emp_code: empRoster.emp_code,
        // shift: shift.name,
        in_time: emp_in_time,
        out_time: emp_out_time,
        attendance_status: codes.ATTENDANCE_HALF_DAY
      };
    }
  }

  //if punched within shift in time window
  if (emp_punch_in_flag === 0) {
    // If punched out before shift out time start
    if (emp_punch_out_flag === 1) {
      return {
        day: currentDate,
        emp_code: empRoster.emp_code,
        // shift: shift.name,
        in_time: emp_in_time,
        out_time: emp_out_time,
        attendance_status: codes.ATTENDANCE_HALF_DAY
      };
    }

    // If punched out within shift out time window
    if (emp_punch_out_flag === 0) {
      if (emp_working_hour >= shift_working_hour) {
        return {
          day: currentDate,
          emp_code: empRoster.emp_code,
          // shift: shift.name,
          in_time: emp_in_time,
          out_time: emp_out_time,
          attendance_status: codes.ATTENDANCE_PRESENT
        };
      }
      return {
        day: currentDate,
        emp_code: empRoster.emp_code,
        // shift: shift.name,
        in_time: emp_in_time,
        out_time: emp_out_time,
        attendance_status: codes.ATTENDANCE_HALF_DAY
      };
    }
  }
}

module.exports = processPunchData