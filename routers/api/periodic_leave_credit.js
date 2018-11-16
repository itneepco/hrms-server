const router = require('express').Router()
const ledgerModel = require('../../model/leaveLedger.model')
const leaveCreditInfo = require('../../model/leaveCreditInfo.model')
const employeeModel = require('../../model/employee.model')
const db = require('../../config/db');
const Op = require('sequelize').Op;
const codes = require('../../global/codes');

router.route('/yearly/cl')
  .post((req, res) => {
    try {
      annualClRhCredit(req, res, codes.CL_CODE) 
    } catch(error) {
      console.log(error)
    }
  })

router.route('/yearly/rh')
  .post((req, res) => {
    try { 
      annualClRhCredit(req, res, codes.RH_CODE) 
    } catch(error) {
      console.log(error)
    }
  })
  
router.route('/half-yearly/el')
  .post((req, res) => {
    console.log("World")
    try {    
      annualElHplCredit(req, res, codes.EL_CODE)
    } catch(error) {
      console.log(error)
    }
  })  

router.route('/half-yearly/hpl')
  .post((req, res) => {
    try {    
      annualElHplCredit(req, res, codes.HPL_CODE)
    } catch(error) {
      console.log(error)
    }
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
      message: "Already processed annual leave credit for the current year", 
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
        created_by: req.user.emp_code,
        remarks: "Annual Leave Credit"
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
      res.status(500).json({message: "Annual Leave Credit Processing Unsuccessful", error: err})
      console.log(err)
      return t.rollback();
    }); 
  })  
}

async function annualElHplCredit(req, res, leave_type) {
  if(!(leave_type == codes.EL_CODE || leave_type == codes.HPL_CODE)) return
  
  let remarks
  const first_half_yearly = "First Half Yearly Leave Credit"
  const second_half_yearly = "Second Half Yearly Leave Credit"
  const curr_year = (new Date()).getFullYear()
  let ledgers = []

  //Check if EL or HPL leaves are credited for the current year
  let result = await leaveCreditInfo.findAll({
    where: {
      cal_year: curr_year,
      leave_type: leave_type
    }
  })

  //Check if EL or HPL have been credited two times already
  if(result.length >= 2) {
    console.log("Already Processed")
    return res.status(200).json({ 
      message: "Already processed annual leave credit for the current year", 
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
        const leave_days = leave_type == codes.EL_CODE ? 15 : 10
        const retirement_date = new Date(employee.dos)
        const retirement_month = retirement_date.getMonth() + 1
        const retirement_year = retirement_date.getFullYear()
        
        let no_of_days = leave_days
        //if retirement age is current calendar year
        if(retirement_year == curr_year) {
          //For the first half-yearly leave credit
          if(result.length == 0) {
            if(retirement_month <= 6) {
              no_of_days = Math.round(leave_days * (retirement_month/6))
            }
          }
          //For the second half-yearly leave credit
          if(result.length == 1) {
            if(retirement_month > 6 && retirement_month <= 12) {
              no_of_days = Math.round(leave_days * ((retirement_month-6)/6))
            }
            else {
              no_of_days = 0
            }
          }
        }
        //if no of days in 0 skip the current loop
        if(no_of_days == 0) return       

        //Remarks for leave ledger record as well as leave credit info
        remarks = result.length == 0 ? first_half_yearly : second_half_yearly
        
        ledgers.push({
          emp_code: employee.emp_code,
          cal_year: curr_year,
          db_cr_flag: 'C',
          no_of_days: no_of_days,
          leave_type: leave_type,
          remarks: remarks
        })
      })

      //Insert in to leave credit info table
      return leaveCreditInfo.create({
        cal_year: curr_year,
        leave_type: leave_type,
        created_by: req.user.emp_code,
        remarks: remarks
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
      res.status(500).json({ message: "Annual Leave Credit Processing Unsuccessful", error: err })
      console.log(err)
      return t.rollback();
    }); 
  })  
}

module.exports = router  