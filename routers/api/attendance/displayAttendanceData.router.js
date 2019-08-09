const router = require("express").Router({ mergeParams: true });
const empWiseRosterModel = require("../../../model/attendance/employeeWiseRoster.model");
const Op = require("sequelize").Op;

router.route("/employee/:empCode").get(async (req, res) => {
  try {

    const empCode  = req.params.empCode;
    const fromDate = new Date(req.query.from_date);
    const toDate   = new Date(req.query.to_date);

    const empWiseRosters = await empWiseRosterModel.findAll({
      where: {
        emp_code: empCode,
        project_id: req.params.projectId,
        day: { [Op.between]: [fromDate, toDate] },
        attendance_status: {[Op.ne]: null}
      }
    });

    res.status(200).json(empWiseRosters);

  } catch (err) {
    console.log('Error : ' + err);
  } finally {
    // Code will be added later
  }
});

router.route("/employee").get(async (req, res) => {
});

module.exports = router;