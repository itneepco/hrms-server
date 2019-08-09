const moment = require("moment");

/*-----------------------------
  input :punch_time,out_time_start,out_time_end
  output : 0 => BETWEEN WINDOW, 1 => BEFORE WINDOW STARTS, 2 => AFTER WINDOW CLOSES

*/
function check_out_time(punch_time, start_time, end_time) {
  if (punch_time > end_time) return 2;
  if (punch_time < start_time) return 1;
  return 0;
}

/*-----------------------------
  input : punch_time,in_time_start,in_time_end,late_time
  output : 0 => BETWEEN WINDOW, 1 => BEFORE WINDOW STARTS, 
           2 => AFTER LATE WINDOW CLOSES, 3 => BETWEEN LATE WINDOW 
*/

function check_in_time(punch_time, start_time, end_time, grace_time) {
  if (punch_time < start_time) return 1;
  if (punch_time > end_time) {
    if (punch_time <= grace_time) return 3;
    return 2;
  }
  return 0;
}

module.exports = { check_out_time, check_in_time };
