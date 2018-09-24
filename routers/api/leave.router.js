
const router = require('express').Router()
const ledgerModel = require('../../model/leaveLedger.model')
const Sequelize = require('sequelize');
const codes = require('../../global/codes');

router.route('/ledger')
  .post((req, res) => {

    ledgerModel.build(
      {
        emp_code: req.body.emp_code,
        cal_year: req.body.cal_year,
        db_cr_flag: req.body.db_cr_flag,
        no_of_days: req.body.no_of_days,
        leave_type: req.body.leave_type,
        remarks: req.body.remarks
      })
      .save()
      .then(result => {
        console.log(result)
        //res.redirect('/ledger/:'+result.id)
        //res.status(200).send(result)
        findLedger(result.id, res)
      })
      .catch(err => {
        console.log(err)
        res.status(500).json({ message: 'Opps! Some error occured!!' })
      })
  })
router.route('/ledger/:id')
  .get((req, res) => {

    ledgerModel.findOne(
      {
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
    ledgerModel.update(
      {
        emp_code: req.params.emp_code,
        cal_year: req.body.cal_year,
        db_cr_flag: req.body.db_cr_flag,
        no_of_days: req.body.no_of_days,
        leave_type: req.body.leave_type,
        remarks: req.body.remarks
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

// Return an array of { balance: val, leave_type: type, leave_type_id: id } object
router.route('/status/:emp_code/:year_param')
  .get((req, res) => {
    getTotalDebitCredit(req.params.emp_code, req.params.year_param)
      .then(result => {
        res.status(200).json(result)
      })
      .catch(error => {
        console.log(error)
      })
  })

router.route('/ledger/employee/:emp_code')
  .get((req, res) => {
    let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0
    let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50
    let offset = pageIndex * limit
    ledgerModel.findAndCountAll({
      where: { emp_code: req.params.emp_code },
      order: [['updated_at', 'DESC']],
      limit: parseInt(req.query.pageSize),
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

  return Promise.all([total_credit_cl, total_debit_cl, total_credit_rh, total_debit_rh])
    .then(val => {
      // Return an array of { remaining: val, leave_code: code } object
      let leaveRegister = [
        {
          balance: JSON.parse(JSON.stringify(val[0][0])).total_credit - JSON.parse(JSON.stringify(val[1][0])).total_debit,
          leave_code: codes.CL_CODE,
        },
        {
          balance: JSON.parse(JSON.stringify(val[2][0])).total_credit - JSON.parse(JSON.stringify(val[3][0])).total_debit,
          leave_code: codes.RH_CODE,
        }
      ];

      return leaveRegister
    })
    .catch(err => {
      console.log(err)
    })
}

module.exports = router