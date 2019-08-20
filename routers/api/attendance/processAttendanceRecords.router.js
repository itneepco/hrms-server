const router = require("express").Router({ mergeParams: true });
const empWiseRosterModel = require("../../../model/attendance/employeeWiseRoster.model");
const shiftModel = require("../../../model/attendance/shift.model");
const punchRecModel = require("../../../model/attendance/punchingRec.model");
const wageMonthModel = require("../../../model/attendance/wageMonth.model");
const processPunchData = require("./functions/processPunchData");
const codes = require("../../../global/codes");
const db = require("../../../config/db");
const Op = require("sequelize").Op;
const moment = require("moment");

router.route("/process").get(async (req, res) => {
  try {
    const currentDate = new Date(req.query.day);

    //Get the wage month for the currentdate
    const currWageMonth = await wageMonthModel.findOne({
      where: {
        project_id: req.params.projectId,
        from_date: { [Op.lte]: currentDate },
        to_date: { [Op.gte]: currentDate },
        status: codes.WAGE_MONTH_ACTIVE
      }
    });

    const shiftTimings = await shiftModel.findAll({
      where: {
        project_id: req.params.projectId,
        is_general: false
      }
    });
    console.log("Length ", shiftTimings.length);

    if (!currWageMonth) {
      return res.status(200).json({
        message: "Wage month corresponding to day does not exist",
        error: false,
        data: null
      });
    }

    // Check if general roster is generated
    if (!currWageMonth.gen_roster_status) {
      return res.status(200).json({
        message: "Employee wise general roster not generated for the period",
        error: false,
        data: null
      });
    }

    // Check if there are any shift duty. if present check if shift roster is generated
    if (shiftTimings.length > 0 && !currWageMonth.shift_roster_status) {
      return res.status(200).json({
        message: "Employee wise shift roster not generated for the period",
        error: false,
        data: null
      });
    }

    // Get punching records for the currentDate
    const punchingRecords = await punchRecModel.findAll({
      where: {
        project_id: req.params.projectId,
        punching_date: { [Op.eq]: currentDate }
      }
    });

    console.log("Punching records length", punchingRecords.length);

    // Get employee wise rosters for the currentDate
    const empWiseRosters = await empWiseRosterModel.findAll({
      where: {
        day: currentDate,
        project_id: req.params.projectId
      },
      include: [{ model: shiftModel }]
    });

    console.log("Employee roster length", empWiseRosters.length);

    // Get array of emp_code having night shift on the currentDate
    const nightShiftEmployees = empWiseRosters
      .filter(roster => roster.shift.is_night_shift)
      .map(roster => roster.emp_code);

    // Get next day based on current date
    const nextDay = moment(currentDate)
      .add(1, "day")
      .toDate();

    //Get punching records for the next Day
    const punchRecsNextDay = await punchRecModel.findAll({
      where: {
        project_id: req.params.projectId,
        punching_date: { [Op.eq]: nextDay },
        emp_code: { [Op.in]: nightShiftEmployees }
      }
    });

    console.log("Next day punching records length", punchRecsNextDay.length);

    // array to store the attendance objects for the currentDate
    let attendanceArray = [];

    // Iterate over every row in employee wise roster
    empWiseRosters.forEach(empRoster => {
      attendanceArray.push(
        processPunchData(
          empRoster,
          punchingRecords,
          punchRecsNextDay,
          currentDate
        )
      );
    }); //End of forEach loop

    // console.log("Attendance", attendanceArray);

    if (attendanceArray.length > 0) {
      try {
        insertEmpWiseRoster(attendanceArray);
        res.status(200).json({
          message: "Attendance Data Processed Successfully.",
          error: false,
          data: attendanceArray
        });
      } catch (err) {
        console.log(err);
        throw err;
      }
    }
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: `Error:: ${error.name}`, error: true, data: null });
  }
});

async function insertEmpWiseRoster(dataArray) {
  let transaction;
  try {
    transaction = await db.transaction();
    promiseArray = [];
    await dataArray.forEach(async data => {
      promiseArray.push(
        empWiseRosterModel.update(
          {
            in_time: data.in_time,
            out_time: data.out_time,
            attendance_status: data.attendance_status
          },
          { 
            where: { emp_code: data.emp_code, day: data.day },
            transaction
          },
        )
      );
    });

    Promise.all(promiseArray)
      .then(() => {
        transaction.commit();
        return { message: "SUCCESS" };
      })
      .catch(err => {
        transaction.rollback();
        console.log(err);
        throw error;
      });
  } catch (error) {
    console.log(err);
    throw error;
  }
}

router.route("/modify/shift/").post(async (req, res) => {
  try {
    const roster_id = req.body.id;
    const shift_id = req.body.shift_id;

    const empRoster = await empWiseRosterModel.findOne({
      where: { id: roster_id },
      include: [{ model: shiftModel }]
    });

    // If empRoster does not exist, then return
    if (!empRoster) {
      return res.status(200).json({
        message: `No data found corresponding to emp_roster_id ${roster_id}`
      });
    }

    if (empRoster.shift.id == shift_id) {
      return res.status(200).json({ message: "No changes made" });
    }

    const shift = await shiftModel.findOne({
      where: {
        id: shift_id,
        project_id: req.params.projectId
      }
    });

    // If shift does not exist, then return
    if (!shift) {
      return res.status(200).json({
        message: `No data found corresponding to shift_id ${shift_id}`
      });
    }

    // console.log("BEFORE", empRoster)
    // Assign the new shift to empRoster object
    empRoster.shift_id = shift_id;
    empRoster.shift = shift;
    // console.log("AFTER", empRoster)

    // Get punching records for the currentDate
    const punchingRecords = await punchRecModel.findAll({
      where: {
        project_id: empRoster.project_id,
        emp_code: empRoster.emp_code,
        punching_date: { [Op.eq]: empRoster.day }
      }
    });

    console.log("Punching records length", punchingRecords.length);

    //Get punching records for the next Day
    let punchRecsNextDay = [];
    if (shift.is_night_shift) {
      punchRecsNextDay = await punchRecModel.findAll({
        where: {
          project_id: empRoster.project_id,
          emp_code: empRoster.emp_code,
          punching_date: { [Op.eq]: empRoster.day }
        }
      });
    }

    console.log("Next day punching records length", punchRecsNextDay.length);

    const attendance = processPunchData(
      empRoster,
      punchingRecords,
      punchRecsNextDay,
      empRoster.day
    );

    const result = await empRoster.update({
      attendance_status: attendance.attendance_status,
      shift_id: shift_id,
      remarks: req.body.remarks,
      in_time: attendance.in_time,
      out_time: attendance.out_time
    });

    console.log(result);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: `Error:: ${error.name}`, error: true, data: null });
  }
});

router.route("/modify/status/").post(async (req, res) => {
  try {
    const roster_id = req.body.id;

    const empRoster = await empWiseRosterModel.findOne({
      where: { id: roster_id },
      include: [{ model: shiftModel }]
    });

    // If empRoster does not exist, then return
    if (!empRoster) {
      return res.status(200).json({
        message: `No data found corresponding to emp_roster_id ${roster_id}`
      });
    }

    const result = await empRoster.update({
      modified_status: true,
      remarks: req.body.remarks
    });

    console.log(result);
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: `Error:: ${error.name}`, error: true, data: null });
  }
});

module.exports = router;
