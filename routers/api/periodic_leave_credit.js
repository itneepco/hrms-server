const router = require('express').Router()
const ledgerModel = require('../../model/leaveLedger.model')
const leaveCreditInfo = require('../../model/leave_credit_info.model')
const employeeModel = require('../../model/employee.model')
const db = require('../../config/db');
const Op = require('sequelize').Op;
const codes = require('../../global/codes');

router.route('/yearly/cl')
  .post((req, res) => {
    annualClRhCredit(req, res, codes.CL_CODE)
  })

router.route('/yearly/rh')
  .post((req, res) => {
    annualClRhCredit(req, res, codes.RH_CODE)
  })  

async function annualClRhCredit(req, res, leave_type) {
  if(!(leave_type == codes.CL_CODE || leave_type == codes.RH_CODE)) return

  let curr_year = (new Date()).getFullYear()
  let ledgers = []

  //Check if leave is credited for the current year and the given leave type
  let result = await leaveCreditInfo.findOne({
    where: {
      cal_year: curr_year,
      leave_type: leave_type
    }
  })
  
  if(result) {
    console.log("Already Processed")
    return res.status(200).json({ 
      message: "Already process annual leave credit for the current year", 
      year: curr_year 
    })
  }

  //Start transaction
  db.transaction().then(t => {
    employeeModel.findAll({
      order: [['emp_code', 'ASC']],
      where: {
        dos: { [Op.gte]: [new Date()] }
      }
    })
    .then(employees => {
      //For each active employee, prepare a ledger record
      employees.forEach(employee => {
        let no_of_days = leave_type == codes.CL_CODE ? 12 : 2
        let retirement_date = new Date(employee.dos)
        let retirement_year = retirement_date.getFullYear()
        
        //if retirement age is current calendar year
        if(retirement_year == curr_year) {
          if(leave_type == codes.CL_CODE) {
            //no of CL should be equal to retirement month value
            no_of_days = retirement_date.getMonth() + 1
          }
          if(leave_type == codes.RH_CODE) {
            no_of_days = (retirement_date.getMonth() + 1) > 6 ? 2 : 1
          }
        }
        console.log("\nNo of Days", no_of_days)

        ledgers.push({
          emp_code: employee.emp_code,
          cal_year: curr_year,
          db_cr_flag: 'C',
          no_of_days: no_of_days,
          leave_type: leave_type,
          remarks: "Annual Leave Credit"
        })
      })

      //Insert in to leave credit info table
      return leaveCreditInfo.create({
        cal_year: curr_year,
        leave_type: leave_type,
        created_by: req.user.emp_code
      }, { transaction: t })
      .then(() => {
        //Bulk insert in to leave leder table
        return ledgerModel.bulkCreate(ledgers.slice(0,3), { transaction: t })
      })
    })
    .then(() => {
      t.commit()
      res.status(200).json({ 
        message: "Annual Leave Credit Processing Successful", 
        year: curr_year 
      })
    })
    .catch(function (err) {
      res.status(500).json({message: "Annual Leave Credit Crocessing Unsuccessful"})
      console.log(err)
      return t.rollback();
    }); 
  })  
}

module.exports = router  