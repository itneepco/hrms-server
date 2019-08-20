const router = require('express').Router({ mergeParams: true });
const wageMonthModel = require('../../../model/attendance/wageMonth.model');
const dateTimeHelper = require('./functions/dateTimeHelper');
const db = require('../../../config/db');
const Op = require('sequelize').Op;

router.route('/')
.get(async(req,res)=>{

  //Get the current active and next wage month
     
  const wageMonths = await wageMonthModel.findAll({
      where: {
        project_id: req.params.projectId,
        status: {[Op.lt]:3}
      }
  });

  let currentWageMonth, nextWageMonth;
  if(wageMonths.length > 1){
      currentWageMonth = wageMonths.filter(val=> val.status === 1);
      nextWageMonth = wageMonths.filter(val=> val.status === 2);
  } 
 
 
  let records_array = await calculateAbsenteeStatement(req.params.projectId);
  console.log("length : " + records_array.length);

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

  res.status(200).json({currentWageMonth,nextWageMonth});
});
 
module.exports = router;