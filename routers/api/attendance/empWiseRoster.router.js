const router = require("express").Router({ mergeParams: true });
const employeeGroup = require("../../../model/attendance/employeeGroup.model");
const groupModel = require("../../../model/attendance/group.model");
const emplGroupWiseModel = require("../../../model/attendance/employeeWiseRoster.model");
const shiftRoster = require("../../../model/attendance/shiftRoster.model");
const Op = require("sequelize").Op;

router.route("/").get(async (req, res) => {
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
            shift_id: roster.shift_id
          });  
          return true;      
        }
        
      });
    });

    emplGroupWiseModel
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
