const router = require('express').Router()
const leaveAppModel = require('../../model/leaveApplication.model')
const leaveDayModel = require('../../model/leaveDay.model')
const leaveAppHistModel = require('../../model/leaveApplicationHist.model')
const LeaveTypeModel = require('../../model/leaveType.model');
const EmployeeModel = require('../../model/employee.model');
const WorkflowActionModel = require('../../model/workflowAction.model')

const Sequelize = require('sequelize');

router.route('/:officerEmpCode')
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
          },
          { model: WorkflowActionModel }
        ]
      },
      {
        model: leaveDayModel,
        include: { model: LeaveTypeModel }
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
                workflowAction: hist.workflowAction,
                updated_at: hist.updated_at,
                isCurrent: hist.isCurrent
              })
            }),
            leaveDays: result.leaveDays.map(leaveDay => {
              return Object.assign({}, {
                id: leaveDay.id,
                leaveType: leaveDay.leaveType,
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

module.exports = router