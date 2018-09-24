const router = require('express').Router()
const leaveAppModel = require('../../model/leaveApplication.model')
const leaveDayModel = require('../../model/leaveDay.model')
const leaveAppHistModel = require('../../model/leaveApplicationHist.model')
const leaveLedgerModel = require('../../model/leaveLedger.model')
const EmployeeModel = require('../../model/employee.model');
const Codes = require('../../global/codes')
const Sequelize = require('sequelize');

router.route('/officer/:officerEmpCode')
  .get((req, res) => {
    let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0
    let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50
    let offset = pageIndex * limit

    leaveAppModel.findAndCountAll({
      order: [['updated_at', 'DESC']],
      include: [
        {
          model: EmployeeModel,
          as: "leaveApplier",
          attributes: ['first_name', 'last_name'],
        },
        {
          model: leaveAppHistModel,
          where: {
            officer_emp_code: req.params.officerEmpCode,
            isCurrent: 1
          },
          include: [
            {
              model: EmployeeModel,
              as: "officer",
              attributes: ['emp_code', 'first_name', 'last_name'],
            }
          ]
        },
        {
          model: leaveDayModel

        }
      ]
    })
      .then(results => {
        if (!results) return res.status(200).json(null)

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
              created_at: result.created_at,
              history: result.leaveApplicationHists.map(hist => {
                return Object.assign({}, {
                  id: hist.id,
                  officer: hist.officer,
                  workflow_action: hist.workflow_action,
                  updated_at: hist.updated_at,
                  isCurrent: hist.isCurrent,
                  remarks: hist.remarks
                })
              }),
              leaveDays: result.leaveDays.map(leaveDay => {
                return Object.assign({}, {
                  id: leaveDay.id,
                  leave_type: leaveDay.leave_type,
                  from_date: leaveDay.from_date,
                  to_date: leaveDay.to_date
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

      leaveAppModel.find({
        where: { id: req.params.leaveAppId },
        include: [
          {
            model: leaveDayModel
          }
        ]
      }).then(result => {
        console.log(JSON.stringify(result))

        leaveAppHistModel.create({
          leave_application_id: req.params.leaveAppId,
          remarks: req.body.remarks,
          officer_emp_code: req.body.officer_emp_code,
          workflow_action: action,
          isCurrent: 0
        })

        let no_of_cl = result.leaveDays.filter(leaveDay => leaveDay.leave_type === Codes.CL_CODE).length
        let no_of_rh = result.leaveDays.filter(leaveDay => leaveDay.leave_type === Codes.RH_CODE).length

        if(no_of_cl > 0) {
          leaveLedgerModel.create({
            cal_year: '2018',
            db_cr_flag: 'D',
            no_of_days: no_of_cl,
            leave_type: Codes.CL_CODE,
            emp_code: result.emp_code, 
            remarks: req.body.remarks
          })
        }

        if(no_of_rh > 0) {
          leaveLedgerModel.create({
            cal_year: '2018',
            db_cr_flag: 'D',
            no_of_days: no_of_rh,
            leave_type: Codes.RH_CODE,
            emp_code: result.emp_code, 
            remarks: req.body.remarks
          })
        }
      })

      res.sendStatus(200)
    }
  });


module.exports = router