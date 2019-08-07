const moment = require("moment");

function enumerateDaysBetweenDates(startDate, endDate) {
  var dates = [];

  var currDate = moment(startDate).startOf("day");
  var lastDate = moment(endDate).startOf("day");

  dates.push(currDate.clone().toDate());

  while (currDate.add(1, "days").diff(lastDate) <= 0) {
    console.log(currDate.toDate());
    dates.push(currDate.clone().toDate());
  }

  return dates;
}

module.exports = enumerateDaysBetweenDates;