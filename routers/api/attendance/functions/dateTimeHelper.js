const moment = require("moment");

function getTimeInterval(startTime, endTime) {

  const start = moment(startTime, "HH:mm");
  const end = moment(endTime, "HH:mm");
  const interval = moment.duration(end.diff(start));
  const hours =
    interval.asHours() >= 0 ? interval.asHours() : interval.asHours() + 24;
  return hours;

}

function getMinTime(punchRecArray) {

  if(punchRecArray.length < 1) return '';

  const min = punchRecArray.reduce(function(prev, current) {
    return moment.utc(prev.punching_time, "HH:mm") <
      moment.utc(current.punching_time, "HH:mm")
      ? prev
      : current;
  }).punching_time;

  return min;
}

function getMaxTime(punchRecArray) {
  if(punchRecArray.length < 1) return '';

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

module.exports ={getTimeInterval,getMaxTime,getMinTime,getMinMaxTime};
