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
  try {
    const fromDate = new Date(req.query.from_date);
    const toDate = new Date(req.query.to_date);
  
    const currWageMonth = await wageMonthModel.findOne({
      where: {
        from_date: fromDate,
        to_date: toDate,
        project_id: req.params.projectId
      }
    })

    if(!currWageMonth) {
      res.status(200).json({ message: "Wage month does not exist for that period"})
      return;
    }

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
        day: { [Op.between]: [currWageMonth.from_date, currWageMonth.to_date] }
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
            project_id: req.params.projectId,
            created_by: req.user.emp_code
          });
        }
      });
    });

    empWiseRosterModel
      .bulkCreate(empWiseRosters, {
        updateOnDuplicate: ["emp_code", "day", "shift_id", "project_id"]
      })
      .then(async () => {
        await currWageMonth.update({ shift_roster_status: true })
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
  try {
    fromDate = new Date(req.query.from_date);
    toDate = new Date(req.query.to_date);

    const currWageMonth = await wageMonthModel.findOne({
      where: {
        from_date: fromDate,
        to_date: toDate,
        project_id: req.params.projectId
      }
    })

    if(!currWageMonth) {
      res.status(200).json({ message: "Wage month does not exist for that period"})
      return;
    }

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
    wagePeriod = enumerateDaysBetweenDates(currWageMonth.from_date, currWageMonth.to_date);

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
            project_id: req.params.projectId,
            created_by: req.user.emp_code
          });
        });
      }
    });

    empWiseRosterModel
      .bulkCreate(empWiseRosters, {
        updateOnDuplicate: ["emp_code", "day", "shift_id", "project_id"]
      })
      .then(async () => {
        await currWageMonth.update({ gen_roster_status: true })
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
