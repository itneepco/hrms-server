
const router = require('express').Router()
const leaveAppModel = require('../../model/leaveApplication.model')
const leaveDayModel = require('../../model/leaveDay.model')
const leaveAppHistModel = require('../../model/leaveApplicationHist.model')
const LeaveTypeModel = require('../../model/leaveType.model');
const EmployeeModel = require('../../model/employee.model');
const WorkflowActionModel = require('../../model/workflowAction.model')

const Sequelize = require('sequelize');

router.get('/employee/:empCode', (req, res) => {

  leaveAppModel.findAll({
      where: { emp_code: req.params.empCode },
      include: [
        {
          model: leaveAppHistModel,
          include: [
            { 
              model: EmployeeModel,
              as: "officer",
              attributes: ['emp_code', 'first_name', 'last_name'],
              order: [['updated_at', 'ASC']] 
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

      let application = results.map(result => {
        return Object.assign(
          {},
          { 
            id: result.id,
            emp_code: result.emp_code,
            purpose: result.purpose,
            address: result.address,
            contact_no: result.contact_no,
            created_at: result.created_at,
            history: result.leaveApplicationHists.map(hist => {
              return Object.assign({}, {
                id: hist.id,
                officer: hist.officer,
                workflowAction: hist.workflowAction,
                updated_at: hist.updated_at  
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

      res.status(200).json(application)
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
            workflow_action_id: 1
          }
        )

        leave_days = leave_days.map(leaveDay => {
          return Object.assign(leaveDay, { leave_application_id: result.id })
        });

        leaveDayModel.bulkCreate(leave_days)

        res.status(200).json({message: "Created successfully"})
      })
      .catch(err => {
        console.log(err)
        res.status(500).json({ message: 'Opps! Some error occured!!' })
      })
  })

router.route('/apply/:id')
  .get((req, res) => {

    ledgerModel.findOne(
      {
        where: { id: req.params.id },
        include: [{ model: leaveTypeModel }]
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
      }
      )
  })

  .put((req, res) => {
    ledgerModel.update(
      {
        emp_code: req.params.emp_code,
        cal_year: req.body.cal_year,
        db_cr_flag: req.body.db_cr_flag,
        no_of_days: req.body.no_of_days,
        leave_type_id: req.body.leave_type_id,
        remarks: req.body.remarks
      },
      { where: { id: req.params.id } })
      .then(() => {
        findLedger(req.params.id, res)
      })
      .catch(err => {
        console.log(err)
        res.status(500).json({ message: 'Opps! Some error happened!!' })
      }
      )
  })


module.exports = router