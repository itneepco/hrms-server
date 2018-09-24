
const router = require('express').Router()
const leaveAppModel = require('../../model/leaveApplication.model')
const leaveDayModel = require('../../model/leaveDay.model')
const leaveAppHistModel = require('../../model/leaveApplicationHist.model')
const EmployeeModel = require('../../model/employee.model');
const codes = require('../../global/codes');

const Sequelize = require('sequelize');

router.get('/employee/:empCode', (req, res) => {
  let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0
  let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50
  let offset = pageIndex * limit

  console.log(limit)

  leaveAppModel.findAndCountAll({
    where: { emp_code: req.params.empCode },
    distinct: true,
    order: [['updated_at', 'DESC']],
    limit: limit,
    offset: offset,
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
      {
        model: leaveDayModel
      }
    ]
  })
    .then(results => {
      if (!results) return res.status(200).json(null)
      let application = results.rows.map(result => {
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
        rows: application,
        count: results.count
      }
      res.status(200).json(data)
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ message: 'Opps! Some error happened!!' })
    })
})

router.route('/')
  .post((req, res) => {
    let officer_emp_code = req.body.officer_emp_code
    let leave_days = req.body.leave_days

    leaveAppModel.build(
      {
        emp_code: req.body.emp_code,
        purpose: req.body.purpose,
        address: req.body.address,
        contact_no: req.body.contact_no,
      })
      .save()
      .then(result => {
        console.log(result)

        leaveAppHistModel.create(
          {
            leave_application_id: result.id,
            officer_emp_code: officer_emp_code,
            workflow_action: codes.LEAVE_APPLIED,
            isCurrent: 1
          }
        )

        leave_days = leave_days.map(leaveDay => {
          return Object.assign(leaveDay, { leave_application_id: result.id })
        });

        leaveDayModel.bulkCreate(leave_days)

        res.status(200).json({ message: "Created successfully" })
      })
      .catch(err => {
        console.log(err)
        res.status(500).json({ message: 'Opps! Some error occured!!' })
      })
  })

module.exports = router