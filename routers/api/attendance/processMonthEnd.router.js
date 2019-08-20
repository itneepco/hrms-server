const router = require("express").Router({ mergeParams: true });
const empWiseRosterModel = require("../../../model/attendance/employeeWiseRoster.model");
const wageMonthModel = require("../../../model/attendance/wageMonth.model");
const holidayModel = require("../../../model/shared/holiday.model");
const absentDetailModel = require("../../../model/attendance/absentDetail.model");
const genWorkDayModel = require("../../../model/attendance/generalWorkingDay.model");
const shiftModel = require("../../../model/attendance/shift.model");
const projectModel = require("../../../model/shared/project.model");
const departmentModel = require("../../../model/shared/department.model");
const designationModel = require("../../../model/shared/designation.model");
const gradeModel = require("../../../model/shared/grade.model");
const monthEndModel = require("../../../model/attendance/monthEnd.model");
const dateTimeHelper = require("./functions/dateTimeHelper");
const calculateAbsenteeStatement = require("./functions/calculateAbsenteeStatement");
const codes = require("../../../global/codes");
const Op = require("sequelize").Op;
const db = require("../../../config/db");
const moment = require("moment");

router.route("/absentee-statement").get(async (req, res) => {
  try {
    const fromDate = new Date(req.query.from_date);
    const toDate = new Date(req.query.to_date);
    const projectId = req.params.projectId

    let records_array = await calculateAbsenteeStatement(projectId, fromDate, toDate);
    records_array = records_array.filter(
      record => record.absent_days_count > 0
    );
    res
      .status(200)
      .json({ message: `Success`, error: false, data: records_array });
  } catch (error) {
    console.error("Error : " + error);
    res
      .status(500)
      .json({ message: `Error:: ${error}`, error: true, data: null });
  }
});

router.route("/close").get(async (req, res) => {
  let transaction;
  const projectId = req.params.projectId

  try {
    const today = dateTimeHelper.getTodaysDate();

    //Get the current active and next wage month
    const wageMonths = await wageMonthModel.findAll({
      where: {
        project_id: req.params.projectId,
        status: { [Op.lt]: 3 },
      }
    });

    const shiftTimings = await shiftModel.findAll({
      where: {
        project_id: req.params.projectId,
        is_general: false
      }
    });

    let currWageMonth, nextWageMonth;
    if (wageMonths.length > 1) {
      currWageMonth = wageMonths.find(val => val.status === codes.WAGE_MONTH_ACTIVE);
      nextWageMonth = wageMonths.find(val => val.status === codes.WAGE_MONTH_NEXT);
    }

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

    // Review later
    if (dateTimeHelper.compareDate(today, currWageMonth.to_date) <= 0) {
      res.status(200).json({
        message: `Month end is not possible at this moment`,
        error: false,
        data: null
      });
    }

    let records_array = await calculateAbsenteeStatement(projectId);

    records_array = records_array.map(item => {
      return {
        project_id: item.project_id,
        wage_month_id: currWageMonth.id,
        emp_code: item.emp_code,
        absent_days: item.absent_days.join(","),
        absent_days_number: item.absent_days.length,
        half_days: item.half_days.join(","),
        half_days_number: item.half_days.length,
        late_days: item.late_days.join(","),
        late_days_number: item.late_days.length,
        absent_days_count: item.absent_days_count
      };
    });

    // Create next wage month object
    const nextFromDate = moment(nextWageMonth.from_date).clone().add(1, "months").toDate()
    const nextToDate = moment(nextWageMonth.to_date).clone().add(1, "months").toDate()
    const wageMon = {
      project_id: req.params.projectId,
      from_date: nextFromDate,
      to_date: nextToDate,
      status: codes.WAGE_MONTH_NEXT,
      shift_roster_status: false,
      gen_roster_status: false
    };

    transaction = await db.transaction({ autocommit: false});
    await monthEndModel.bulkCreate(records_array, {
      updateOnDuplicate: ["project_id", "wage_month_id", "emp_code"],
      transaction
    });

    await wageMonthModel.create(wageMon, { transaction });

    await currWageMonth.update(
      { status: codes.WAGE_MONTH_CLOSED },
      { transaction }
    );

    await nextWageMonth.update({ status: codes.WAGE_MONTH_ACTIVE }, { transaction });

    await transaction.commit();
    
    res.status(200).json({ message: `Month end completed succesfully`, error: false, data: null });
  } 
  
  catch (error) {
    console.error("Error : " + error);
    transaction.rollback();
    res.status(500).json({ message: 'An error occured', error: true, data: null });
  }
});

router.route("/absentee-statement-download").get(async (req, res) => {});

module.exports = router;
