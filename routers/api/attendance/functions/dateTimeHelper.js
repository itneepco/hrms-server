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

function compareDate(date1, date2) {
  let result       = null;
  let date1_split  = date1.split('-');
  let date2_split  = date2.split('-');

  let date1_moment = moment(
    date1_split[0] + '-' +
    date1_split[1] + '-' +
    date1_split[2]
  );

  let date2_moment = moment(
    date2_split[0] + '-' +
    date2_split[1] + '-' +
    date2_split[2]
  );

  result = date1_moment.diff(date2_moment, 'days');
  
  
  //console.log('date1 : ' + date1);
  //console.log('date2 : ' + date2);
  //console.log('Current date : ' + date1_split);
  //console.log('Leave date   : ' + date2_split);
  //console.log('date1_moment : ' + date1_moment);
  //console.log('date2_moment : ' + date2_moment);
  //console.log('Result : ' + result)
  

  return result;
}

function isSundaySaturday(date) {
  const day = moment(date).day();
  return day === 0 || day === 6;
}

module.exports ={getTimeInterval,getMaxTime,getMinTime,getMinMaxTime,compareDate,isSundaySaturday};
