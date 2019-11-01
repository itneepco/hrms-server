const moment = require("moment");

function getTodaysDate() {
  return moment(new Date()).format('YYYY-MM-DD');
}

function getTimeInterval(startTime, endTime) {
  const start = moment(startTime, "HH:mm");
  const end = moment(endTime, "HH:mm");
  const interval = moment.duration(end.diff(start));
  const hours =
    interval.asHours() >= 0 ? interval.asHours() : interval.asHours() + 24;
  return hours;
}

function substractHours(time, hour) {
  return moment(time, "HH:mm").subtract(hour, 'hours').format("HH:mm:ss")
}

function getMinTime(in_time_start, in_time_late, punchRecArray) {
  if (punchRecArray.length < 1) return "";

  in_time_window = punchRecArray.filter(data =>
    data.punching_time >= in_time_start && data.punching_time <= in_time_late)

  if (in_time_window.length > 0) {
    console.log("IN TIME WINDOW", in_time_window.length)
    return getMinimum(in_time_window)
  }
  else {
    return getMinimum(punchRecArray)
  }
}

function getMaxTime(punchRecArray) {
  if (punchRecArray.length < 1) return "";

  return getMaximum(punchRecArray)
}

function getMinimum(punchArray) {
  const min = punchArray.reduce(function (prev, current) {
    let prev_moment = moment.utc(prev.punching_time, "HH:mm")
    let curr_moment = moment.utc(current.punching_time, "HH:mm")

    return prev_moment < curr_moment ? prev : current;
  }).punching_time;

  return min;
}

function getMaximum(punchArray) {
  const max = punchArray.reduce(function (prev, current) {
    const prev_moment = moment.utc(prev.punching_time, "HH:mm")
    const curr_moment = moment.utc(current.punching_time, "HH:mm")

    return prev_moment > curr_moment ? prev : current;
  }).punching_time;

  return max;
}

function compareDate(date1, date2) {
  date1 = moment.utc(date1)
  date2 = moment.utc(date2)
  return date1.diff(date2, "days");
}

function equalDate(date1, date2) {
  date1 = new Date(date1)
  date2 = new Date(date2)
  return moment(date1, 'YYYY-MM-DD').isSame(moment(date2, 'YYYY-MM-DD'), "days");
}

function isSundaySaturday(date) {
  const day = moment(date).day();
  return day === 0 || day === 6;
}

function isSunday(date) {
  const day = moment(date).day();
  return day === 0;
}

function isSaturday(date) {
  const day = moment(date).day();
  return day === 6;
}

function decreaseDay(date, no_day) {
  return moment(date).subtract(no_day, 'day').toDate()
}

function increaseDay(date, no_day) {
  return moment(date).add(no_day, 'day').toDate()
}

module.exports = {
  getTimeInterval,
  getMaxTime,
  getMinTime,
  compareDate,
  isSundaySaturday,
  isSunday,
  isSaturday,
  getTodaysDate,
  substractHours,
  equalDate,
  decreaseDay,
  increaseDay
};
