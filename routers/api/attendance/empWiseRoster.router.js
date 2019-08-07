const router = require("express").Router({ mergeParams: true });
const employeeGroup = require("../../../model/attendance/employeeGroup.model");
const groupModel = require("../../../model/attendance/group.model");
const empWiseRosterModel = require("../../../model/attendance/employeeWiseRoster.model");
const wageMonthModel = require('../../../model/attendance/wageMonth.model');
const shiftRoster = require("../../../model/attendance/shiftRoster.model");
const genRosterModel = require("../../../model/attendance/generalRoster.model");
const Op = require("sequelize").Op;
//const moment = require("moment");
const enumerateDaysBetweenDates = require('./functions/enumerateDaysBetweenDates');


router.route("/shift").get(async (req, res) => {
  fromDate = req.query.from_date;
  toDate = req.query.to_date;

  try {
    empGroups = await employeeGroup.findAll({
      include: [
        {
          model: groupModel,
          as: "group",
          where: {
            project_id: req.params.projectId,
            is_general: false
          }
        }
      ]
    });

    shiftRosters = await shiftRoster.findAll({
      include: [
        {
          model: groupModel,
          as: "group",
          where: { project_id: req.params.projectId }
        }
      ],
      where: {
        day: { [Op.between]: [fromDate, toDate] }
      }
    });

    empWiseRosters = [];
    shiftRosters.forEach(roster => {
      empGroups.forEach(empGroup => {
        if (roster.group_id === empGroup.group_id) {
          empWiseRosters.push({
            emp_code: empGroup.emp_code,
            day: roster.day,
            shift_id: roster.shift_id,
            project_id: req.params.projectId
          });
        }
      });
    });

    empWiseRosterModel
      .bulkCreate(empWiseRosters, {
        updateOnDuplicate: ["emp_code", "day", "shift_id"]
      })
      .then(() => {
        //  wageMonthModel.update({
        //   shift_roster_status:true,
        //   where:{
        //     from_date:fromDate,
        //     to_date: toDate,
        //     project_id: req.params.projectId
        //   }
        //  })
        res.status(200).json(empWiseRosters);
      })
      .catch(err => {
        throw err;
      });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Opps! Some error happened!!" });
  }
});

router.route("/general").get(async (req, res) => {
  fromDate = new Date(req.query.from_date);
  toDate = new Date(req.query.to_date);

  if (!fromDate || !toDate)
    return res.status(200).json({ message: "Incorrect date format" });

  try {
    const empGroups = await employeeGroup.findAll({
      include: [
        {
          model: groupModel,
          as: "group",
          where: {
            project_id: req.params.projectId,
            is_general: true
          }
        }
      ]
    });

    const genRosters = await genRosterModel.findAll({
      include: [
        {
          model: groupModel,
          as: "group",
          where: { project_id: req.params.projectId }
        }
      ]
    });

    empWiseRosters = [];
    wagePeriod = enumerateDaysBetweenDates(fromDate, toDate);

    empGroups.forEach(empGroup => {
      const roster = genRosters.find(
        roster => roster.group_id == empGroup.group_id
      );
      if (roster) {
        wagePeriod.forEach(async wageDay => {
          empWiseRosters.push({
            emp_code: empGroup.emp_code,
            day: wageDay,
            shift_id: roster.shift_id,
            project_id: req.params.projectId
          });
        });
      }
    });

    empWiseRosterModel
      .bulkCreate(empWiseRosters, {
        updateOnDuplicate: ["emp_code", "day", "shift_id"]
      })
      .then(() => {
        console.log("Length", empWiseRosters.length);
        res.status(200).json(empWiseRosters);
      })
      .catch(err => {
        throw err;
      });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Opps! Some error happened!!" });
  }
});



module.exports = router;
