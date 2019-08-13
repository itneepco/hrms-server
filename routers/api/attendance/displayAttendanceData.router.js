const router = require("express").Router({ mergeParams: true });
const empWiseRosterModel = require("../../../model/attendance/employeeWiseRoster.model");
const shiftModel = require("../../../model/attendance/shift.model");
const holidayModel = require('../../../model/shared/holiday.model');
const Op = require("sequelize").Op;

router.route("/employee/:empCode").get(async (req, res) => {
  try {
    const empCode = req.params.empCode;
    const fromDate = new Date(req.query.from_date);
    const toDate = new Date(req.query.to_date);

    // Get holidays for the wagemonth
    const holidaysArray = await holidayModel.findAll({
      where: {
        day: { [Op.between]: [fromDate, toDate] },
        type: {[Op.eq]: 'CH'}
      }
    })
  
    console.log(holidaysArray);

    const empWiseRosters = await empWiseRosterModel.findAll({
      include: [
        {
          model: shiftModel
        }
      ],
      where: {
        emp_code: empCode,
        project_id: req.params.projectId,
        day: { [Op.between]: [fromDate, toDate] },
        attendance_status: { [Op.ne]: null }
      }
    }).map(emp => {
      return Object.assign(
        {},
        {
          id: emp.id,
          day:emp.day,
          emp_code: emp.emp_code,
          shift: {id:emp.shift.id,name:emp.shift.name,is_general: emp.shift.is_general},          
          in_time: emp.in_time,
          out_time: emp.out_time,
          attendance_status: emp.attendance_status,
          modified_status: emp.modified_status,
          remarks: emp.remarks
        }
      )
    });

    // const empAttendData = empWiseRosters.map(emp => {
    //   return Object.assign(
    //     {},
    //     {
    //       id: emp.id,
    //       day:emp.day,
    //       emp_code: emp.emp_code,
    //       shift_id: emp.shift.id,
    //       shift_name: emp.shift.name,
    //       is_general: emp.shift.is_general,
    //       in_time: emp.in_time,
    //       out_time: emp.out_time,
    //       attendance_status: emp.attendance_status,
    //       modified_status: emp.modified_status,
    //       remarks: emp.remarks
    //     }
    //   );
    // });

    console.log(empWiseRosters);

    res.status(200).json(empWiseRosters);
  } catch (err) {
    console.log("Error : " + err);
  } finally {
    // Code will be added later
  }
});

router.route("/employee").get(async (req, res) => {});

module.exports = router;
