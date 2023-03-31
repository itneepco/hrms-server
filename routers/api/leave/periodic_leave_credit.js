const router = require('express').Router()
const ledgerModel = require('../../../model/leave/leaveLedger.model')
const leaveYearEndInfo = require('../../../model/leave/leaveYearEndInfo.model')
const leaveCreditInfo = require('../../../model/leave/leaveCreditInfo.model')
const employeeModel = require('../../../model/shared/employee.model')
const db = require('../../../config/db');
const Op = require('sequelize').Op;
const codes = require('../../../global/codes');
const Sequelize = require('sequelize');

router.route('/yearly/cl')
  .get((req, res) => {
    try {
      annualClRhCredit(req, res, codes.CL_CODE) 
    } catch(error) {
      console.log(error)
    }
  })

router.route('/yearly/rh')
  .get((req, res) => {
    try { 
      annualClRhCredit(req, res, codes.RH_CODE) 
    } catch(error) {
      console.log(error)
    }
  })
  
router.route('/half-yearly/el')
  .get((req, res) => {
    console.log("World")
    try {    
      halfYearlyElHplCredit(req, res, codes.EL_CODE)
    } catch(error) {
      console.log(error)
    }
  })  

router.route('/half-yearly/hpl')
  .get((req, res) => {
    try {    
      halfYearlyElHplCredit(req, res, codes.HPL_CODE)
    } catch(error) {
      console.log(error)
    }
  })

router.route('/year-closing') 
  .get((req, res) => {
    try {
      computeYearEndLeaveBalance(req ,res)
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
      // limit: 3,
      where: {
        dos: { [Op.gte]: new Date() }
      }
    })
    .then(employees => {
      //For each active employee, prepare a ledger record
      employees.forEach(employee => {
        let no_of_days = leave_type == codes.CL_CODE ? 12 : 2
        let retirement_date = new Date(employee.dos)
        let retirement_year = retirement_date.getFullYear()

        //if retirement age is current calendar year
        // if(retirement_year == curr_year) {
        //   if(leave_type == codes.CL_CODE) {
        //     //no of CL should be equal to retirement month value
        //     no_of_days = retirement_date.getMonth() + 1
        //   }
        //   if(leave_type == codes.RH_CODE) {
        //     no_of_days = (retirement_date.getMonth() + 1) > 6 ? 2 : 1
        //   }
        // }

        // If the employee is PWD category, add 4 days to Casual Leave
        if(employee.pwd && leave_type == codes.CL_CODE) {
          //no of CL should be equal to retirement month value
          no_of_days = no_of_days + 4
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
        return ledgerModel.bulkCreate(ledgers, { transaction: t })
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

async function halfYearlyElHplCredit(req, res, leave_type) {
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
      // limit: 3,
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
        return ledgerModel.bulkCreate(ledgers, { transaction: t })
      })
    })
    .then(() => {
      t.commit()
      res.status(200).json({ 
        message: "Half Yearly Leave Credit Processing Successful", 
        year: curr_year 
      })
    })
    .catch(function (err) {
      res.status(500).json({ message: "Half Yearly Leave Credit Processing Unsuccessful", error: err })
      console.log(err)
      return t.rollback();
    }); 
  })  
}

async function computeYearEndLeaveBalance(req, res) {
  let curr_year = (new Date()).getFullYear()
  let prev_year = curr_year - 1
  let ledgers = []

  //Check if year end in processed for previous year
  let result = await leaveYearEndInfo.findOne({
    where: {
      cal_year: prev_year
    }
  })
  
  if(result) {
    console.log("Already Processed")
    return res.status(200).json({ 
      message: "Already processed annual year end processing for previous year", 
      year: prev_year
    })
  }

  employeeModel.findAll({
    order: [['emp_code', 'ASC']],
    // limit: 3,
    where: {
      dos: { [Op.gte]: [new Date()] }
    }
  })
  .then(employees => {
    let promises = employees.map(async (employee) => {
      let el_balance = await getClosingBalance(employee.emp_code, codes.EL_CODE, prev_year)
      let hpl_balance = await getClosingBalance(employee.emp_code, codes.HPL_CODE, prev_year)
      
      if(el_balance > 0) {
        ledgers.push({
          emp_code: employee.emp_code,
          cal_year: curr_year,
          db_cr_flag: 'C',
          no_of_days: el_balance,
          leave_type: codes.EL_CODE,
          remarks: "Year Opening Balance"
        })
      }

      if(hpl_balance > 0) {
        ledgers.push({
          emp_code: employee.emp_code,
          cal_year: curr_year,
          db_cr_flag: 'C',
          no_of_days: hpl_balance,
          leave_type: codes.HPL_CODE,
          remarks: "Year Opening Balance"
        })
      }
    })

    Promise.all(promises).then(function() {
      console.log("Ledgers", ledgers)
      db.transaction().then(t => {
        //Insert in to leave credit info table
        return leaveYearEndInfo.create({
          cal_year: curr_year - 1,
          created_by: req.user.emp_code,
          remarks: "Annual Leave Year End Processing "
        }, { transaction: t })
        .then(() => {
          //Bulk insert in to leave leder table
          return ledgerModel.bulkCreate(ledgers, { transaction: t })
        })
        .then(() => {
          t.commit()
          res.status(200).json({ 
            message: "Leave Year End Processing Successful for previous year", 
            year: curr_year - 1
          })
        })
        .catch(function (err) {
          res.status(500).json({ message: "Leave Year End Processing Unsuccessful", error: err })
          console.log(err)
          return t.rollback();
        })
      })
    })
  })
  .catch(function (err) {
    res.status(500).json({message: "Leave Year End Processing Unsuccessful", error: err})
    console.log(err)
    return t.rollback();
  }); 
}

async function getClosingBalance(emp_code, leave_type, cal_year) {
  let credit = await ledgerModel.findAll({
    attributes: [[Sequelize.fn('SUM', Sequelize.col('no_of_days')), 'total_credit']],
    where: {
      emp_code: emp_code,
      cal_year: cal_year,
      db_cr_flag: 'C',
      leave_type: leave_type
    }
  })
  
  let debit = await ledgerModel.findAll({
    attributes: [[Sequelize.fn('SUM', Sequelize.col('no_of_days')), 'total_debit']],
    where: {
      emp_code: emp_code,
      cal_year: cal_year,
      db_cr_flag: 'D',
      leave_type: leave_type
    }
  })
  let total_credit = JSON.parse(JSON.stringify(credit[0])).total_credit
  total_credit = total_credit ? total_credit : 0
  console.log("Total Credit", total_credit)
  
  let total_debit = JSON.parse(JSON.stringify(debit[0])).total_debit
  total_debit = total_debit ? total_debit : 0
  console.log("Total Debit", total_debit)

  return (total_credit - total_debit)
}

module.exports = router  