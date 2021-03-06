
const router = require('express').Router()
const ledgerModel = require('../../../model/leave/leaveLedger.model')
const Sequelize = require('sequelize');
const codes = require('../../../global/codes');
const validateAdmin = require('../../../middlewares/validateAdmin');

router.route('/ledger/employee/:emp_code')
  .get((req, res) => {
    let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0
    let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50
    let offset = pageIndex * limit

    ledgerModel.findAndCountAll({
      where: { emp_code: req.params.emp_code },
      order: [['updated_at', 'DESC']],
      limit: limit,
      offset: offset
    })
    .then(result => {
      res.status(200).json(result)
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ message: 'Oops! Some error happend' })
    })
  })

router.route('/ledger', validateAdmin)
  .post((req, res) => {
    ledgerModel.build({
      emp_code: req.body.emp_code,
      cal_year: req.body.cal_year,
      db_cr_flag: req.body.db_cr_flag,
      no_of_days: req.body.no_of_days,
      leave_type: req.body.leave_type,
      remarks: req.body.remarks,
      is_manually_added: req.body.is_manually_added
    })
    .save()
    .then(result => {
      console.log(result)
      findLedger(result.id, res)
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ message: 'Opps! Some error occured!!' })
    })
  })

router.route('/ledger/:id', validateAdmin)
  .get((req, res) => {
    ledgerModel.findOne({
      where: { id: req.params.id }
    })
    .then(result => {
      res.status(200).json(result)
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ message: 'Oops! Some error happend' })
    })
  })

  .delete((req, res) => {
    ledgerModel.destroy({
      where: { id: req.params.id }
    })
    .then(result => res.status(200).json(result))
    .catch(err => {
      console.log(err)
      res.status(500).json({ message: 'Opps! Some error happened!!' })
    })
  })

  .put((req, res) => {
    ledgerModel.update({
      emp_code: req.params.emp_code,
      cal_year: req.body.cal_year,
      db_cr_flag: req.body.db_cr_flag,
      no_of_days: req.body.no_of_days,
      leave_type: req.body.leave_type,
      remarks: req.body.remarks,
      is_manually_added: req.body.is_manually_added
    },
    { where: { id: req.params.id } })
    .then(() => {
      findLedger(req.params.id, res)
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ message: 'Opps! Some error happened!!' })
    })
  })

router.route('/balance/:emp_code')
  .get((req, res) => {
    let curr_year = (new Date()).getFullYear()
    getTotalDebitCredit(req.params.emp_code, curr_year)
      .then(result => {
        res.status(200).json(result)
      })
      .catch(error => {
        console.log(error)
      })
  })

router.route('/prev-year/balance/:emp_code')
  .get((req, res) => {
    let curr_year = (new Date()).getFullYear() - 1
    getTotalDebitCredit(req.params.emp_code, curr_year)
      .then(result => {
        res.status(200).json(result)
      })
      .catch(error => {
        console.log(error)
      })
  })
  
router.route('/next-year/balance/:emp_code')
  .get((req, res) => {
    let curr_year = (new Date()).getFullYear() + 1
    getTotalDebitCredit(req.params.emp_code, curr_year)
      .then(result => {
        res.status(200).json(result)
      })
      .catch(error => {
        console.log(error)
      })
  })

function findLedger(lid, res) {
  ledgerModel.findOne({
    where: { id: lid }
  })
  .then(result => {
    res.status(200).json(result)
  })
  .catch(err => {
    console.log(err)
    res.status(500).json({ message: 'Oops! Some error happend' })
  })
}

function totalCredit(emp_code, cal_year, leave_type) {
  return ledgerModel.findAll({
    attributes: [[Sequelize.fn('SUM', Sequelize.col('no_of_days')), 'total_credit']],
    where: {
      emp_code: emp_code,
      cal_year: cal_year,
      db_cr_flag: 'C',
      leave_type: leave_type
    }
  })
  .then(result => {
    return result
  })
  .catch(err => {
    console.log(err)
    return 0
  })
}

function totalDebit(emp_code, cal_year, leave_type) {
  return ledgerModel.findAll({
    attributes: [[Sequelize.fn('SUM', Sequelize.col('no_of_days')), 'total_debit']],
    where: {
      emp_code: emp_code,
      cal_year: cal_year,
      db_cr_flag: 'D',
      leave_type: leave_type
    }
  })
  .then(result => {
    return result
  })
  .catch(err => {
    console.log(err)
    return 0
  })
}

function getTotalDebitCredit(emp_codee, cal_year) {

  let total_credit_cl = totalCredit(emp_codee, cal_year, codes.CL_CODE)
  let total_debit_cl = totalDebit(emp_codee, cal_year, codes.CL_CODE)

  let total_credit_rh = totalCredit(emp_codee, cal_year, codes.RH_CODE)
  let total_debit_rh = totalDebit(emp_codee, cal_year, codes.RH_CODE)

  let total_credit_el = totalCredit(emp_codee, cal_year, codes.EL_CODE)
  let total_debit_el = totalDebit(emp_codee, cal_year, codes.EL_CODE)

  let total_credit_hpl = totalCredit(emp_codee, cal_year, codes.HPL_CODE)
  let total_debit_hpl = totalDebit(emp_codee, cal_year, codes.HPL_CODE)

  return Promise.all([
    total_credit_cl, total_debit_cl, 
    total_credit_rh, total_debit_rh,
    total_credit_el, total_debit_el,
    total_credit_hpl, total_debit_hpl
  ])
  .then(val => {
    // Return an array of { remaining: val, leave_code: code } object
    let leaveRegister = [
      {
        balance: JSON.parse(JSON.stringify(val[0][0])).total_credit - JSON.parse(JSON.stringify(val[1][0])).total_debit,
        leave_code: codes.CL_CODE,
        leave_type: "CL"
      },
      {
        balance: JSON.parse(JSON.stringify(val[2][0])).total_credit - JSON.parse(JSON.stringify(val[3][0])).total_debit,
        leave_code: codes.RH_CODE,
        leave_type: "RH"
      }
      ,
      {
        balance: JSON.parse(JSON.stringify(val[4][0])).total_credit - JSON.parse(JSON.stringify(val[5][0])).total_debit,
        leave_code: codes.EL_CODE,
        leave_type: "EL"
      }
      ,
      {
        balance: JSON.parse(JSON.stringify(val[6][0])).total_credit - JSON.parse(JSON.stringify(val[7][0])).total_debit,
        leave_code: codes.HPL_CODE,
        leave_type: "HPL"
      }
    ];

    return {
      year: cal_year,
      status: leaveRegister
    }
  })
  .catch(err => {
    console.log(err)
  })
}

module.exports = router