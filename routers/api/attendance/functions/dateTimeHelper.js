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

function getMinTime(punchRecArray) {
  if (punchRecArray.length < 1) return "";

  const min = punchRecArray.reduce(function(prev, current) {
    return moment.utc(prev.punching_time, "HH:mm") <
      moment.utc(current.punching_time, "HH:mm")
      ? prev
      : current;
  }).punching_time;

  return min;
}

function getMaxTime(punchRecArray) {
  if (punchRecArray.length < 1) return "";

  const max = punchRecArray.reduce(function(prev, current) {
    return moment.utc(prev.punching_time, "HH:mm") >
      moment.utc(current.punching_time, "HH:mm")
      ? prev
      : current;
  }).punching_time;
  return max;
}

function getMinMaxTime(punchRecArray) {
  const min = punchRecArray.reduce(function(prev, current) {
    return moment.utc(prev.punching_time, "HH:mm") <
      moment.utc(current.punching_time, "HH:mm")
      ? prev
      : current;
  }).punching_time;

  const max = punchRecArray.reduce(function(prev, current) {
    return moment.utc(prev.punching_time, "HH:mm") >
      moment.utc(current.punching_time, "HH:mm")
      ? prev
      : current;
  }).punching_time;

  return { min, max };
}

function compareDate(date1, date2) {
  return moment(date1).diff(moment(date2), "days");
}

function equalDate(date1, date2) {
  date1 = new Date(date1)
  date2 = new Date(date2)
  return moment(date1, 'yyyy-mm-dd').isSame(moment(date2, 'yyyy-mm-dd'), "days");
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

module.exports = {
  getTimeInterval,
  getMaxTime,
  getMinTime,
  getMinMaxTime,
  compareDate,
  isSundaySaturday,
  isSunday,
  isSaturday,
  getTodaysDate,
  substractHours,
  equalDate
};
