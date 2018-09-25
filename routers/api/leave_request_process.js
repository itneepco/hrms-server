const router = require('express').Router()
const leaveAppModel = require('../../model/leaveApplication.model')
const leaveDetailModel = require('../../model/leaveDetail.model')
const leaveAppHistModel = require('../../model/leaveApplicationHist.model')
const leaveLedgerModel = require('../../model/leaveLedger.model')
const EmployeeModel = require('../../model/employee.model');
const Codes = require('../../global/codes')
const db = require('../../config/db');

router.route('/officer/:addresseeEmpCode/count')
  .get((req, res) => { 
    leaveAppModel.count({
      where: {
        addressee: req.params.addresseeEmpCode,
      }
    })
    .then(result => {
      res.status(200).json(result)
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ message: 'Opps! Some error happened!!' })
    })
  })

router.route('/officer/:addresseeEmpCode')
  .get((req, res) => {
    let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0
    let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50
    let offset = pageIndex * limit

    leaveAppModel.findAndCountAll({
      order: [['updated_at', 'DESC']],
      where: {
        addressee: req.params.addresseeEmpCode,
      },
      include: [
        {
          model: EmployeeModel,
          as: "leaveApplier",
          attributes: ['first_name', 'last_name'],
        },
        {
          model: leaveAppHistModel,
          include: [
            {
              model: EmployeeModel,
              as: "officer",
              attributes: ['emp_code', 'first_name', 'last_name'],
            }
          ]
        },
        { model: leaveDetailModel }
      ]
    })
    .then(results => {
      if (!results) return res.status(200).json(null)

      console.log(JSON.stringify(results))
      let leave_request = results.rows.map(result => {
        return Object.assign(
          {},
          {
            id: result.id,
            emp_code: result.emp_code,
            first_name: result.leaveApplier.first_name,
            last_name: result.leaveApplier.last_name,
            purpose: result.purpose,
            address: result.address,
            contact_no: result.contact_no,
            addressee: result.addressee,
            status: result.status,
            prefix_from: result.prefix_from,
            prefix_to: result.prefix_to,
            suffix_from: result.prefix_from,
            suffix_to: result.prefix_to,
            created_at: result.created_at,   

            history: result.leaveApplicationHists.map(hist => {
              return Object.assign({}, {
                id: hist.id,
                officer: hist.officer,
                workflow_action: hist.workflow_action,
                updated_at: hist.updated_at,
                remarks: hist.remarks
              })
            }),
            leaveDetails: result.leaveDetails.map(leaveDetail => {
              return Object.assign({}, {
                id: leaveDetail.id,
                leave_type: leaveDetail.leave_type,
                from_date: leaveDetail.from_date,
                to_date: leaveDetail.to_date
              })
            })
          }
        )
      })

      let data = {
        rows: leave_request,
        count: results.count
      }
      res.status(200).json(data)
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ message: 'Opps! Some error happened!!' })
    })

  })

router.route('/:leaveAppId/actions')
  .post((req, res) => {
    let action = req.body.workflow_action
    if (action === Codes.LEAVE_APPROVED) {
      db.transaction().then(t => {
        leaveAppModel.find({
          where: { id: req.params.leaveAppId },
          include: { model: leaveDetailModel } 
        }, { transaction: t })
        
        .then(result => {
          console.log(JSON.stringify(result.leaveDetails))
          return leaveAppHistModel.create({
            leave_application_id: req.params.leaveAppId,
            remarks: req.body.remarks,
            officer_emp_code: null,
            workflow_action: action,
          }, {transaction: t})

          .then(() => {
            let no_of_cl = result.leaveDetails.filter(leaveDetail => leaveDetail.leave_type === Codes.CL_CODE).length
            let no_of_rh = result.leaveDetails.filter(leaveDetail => leaveDetail.leave_type === Codes.RH_CODE).length

            return insertLeaveLedger("2018", "D", no_of_cl, Codes.CL_CODE, result.emp_code, t)
              .then(() => insertLeaveLedger("2018", "D", no_of_rh, Codes.RH_CODE, result.emp_code, t))
          })
        })
        .then(() => {
          return leaveAppModel.update(
            { status: Codes.LEAVE_APPROVED, addressee: null}, 
            {where: { id: req.params.leaveAppId }
          }, 
          { transaction: t })
        })
        .then(function () {
          res.status(200).json({message: "Leave request processed successful"})
          return t.commit();
        })
        .catch(function (err) {
          res.status(500).json({message: "Leave request processed unsuccessful"})
          console.log(err)
          return t.rollback();
        });
      })
    }
  
    if(action === Codes.LEAVE_REJECTED || action === Codes.LEAVE_NOT_RECOMMENDED) {
      db.transaction().then(t => {
        return leaveAppHistModel.create({
          leave_application_id: req.params.leaveAppId,
          remarks: req.body.remarks,
          officer_emp_code: null,
          workflow_action: action,
        }, {transaction: t})
        
        .then(() => {
          return leaveAppModel.update({ 
              status: Codes.LEAVE_NOT_RECOMMENDED, 
              addressee: null
            }, 
            { where: { id: req.params.leaveAppId }
          }, {transaction: t});
        })
        .then(function () {
          res.status(200).json({message: "Leave request processed successful"})
          return t.commit();
        }).catch(function (err) {
          res.status(500).json({message: "Leave request processed unsuccessful"})
          console.log(err)
          return t.rollback();
        });     
      })
    }

    if(action === Codes.LEAVE_RECOMMENDED) {
      db.transaction().then(t => {
        return leaveAppHistModel.create({
          leave_application_id: req.params.leaveAppId,
          remarks: req.body.remarks,
          officer_emp_code: req.body.officer_emp_code,
          workflow_action: action,
        }, {transaction: t})
        
        .then(() => {
          return leaveAppModel.update(
            { 
              status: Codes.LEAVE_RECOMMENDED, 
              addressee: req.body.officer_emp_code
            }, 
            { where: { id: req.params.leaveAppId }
          }, { transaction: t });
        })
        .then(function () {
          res.status(200).json({message: "Leave request processed successful"})
          return t.commit();
        })
        .catch(function (err) {
          res.status(500).json({message: "Leave request processed unsuccessful"})
          console.log(err)
          return t.rollback();
        });     
      })
    }
  });


function insertLeaveLedger(cal_year, db_cr_flag, no_of_days, leave_type, emp_code, t) {
  if(no_of_days < 1) return 

  return leaveLedgerModel.create({
    cal_year: cal_year,
    db_cr_flag: db_cr_flag,
    no_of_days: no_of_days,
    leave_type: leave_type,
    emp_code: emp_code
  }, { transaction: t })
}

module.exports = router