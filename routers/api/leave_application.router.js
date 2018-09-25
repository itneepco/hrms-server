
const router = require('express').Router()
const leaveAppModel = require('../../model/leaveApplication.model')
const leaveDetailModel = require('../../model/leaveDetail.model')
const leaveAppHistModel = require('../../model/leaveApplicationHist.model')
const EmployeeModel = require('../../model/employee.model');
const codes = require('../../global/codes');

const db = require('../../config/db');

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
      { model: leaveDetailModel }
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
              to_date: leaveDetail.to_date,
              station_leave: leaveDetail.station_leave
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
    let leaveDetails = req.body.leave_details

    db.transaction().then(t => {
      return leaveAppModel.create({
        emp_code: req.body.emp_code,
        purpose: req.body.purpose,
        address: req.body.address,
        contact_no: req.body.contact_no,
        addressee: officer_emp_code,
        status: codes.LEAVE_APPLIED,
        prefix_from: req.body.prefix_from,
        prefix_to: req.body.prefix_to,
        suffix_from: req.body.suffix_from,
        suffix_to: req.body.suffix_from
      }, {transaction: t})
      .then(app => {
        console.log(app)
        return leaveAppHistModel.create({
          leave_application_id: app.id,
          officer_emp_code: officer_emp_code,
          workflow_action: codes.LEAVE_APPLIED,
          remarks: "Leave applied",
        }, {transaction: t})

        .then(appHist => {
          leaveDetails = leaveDetails.map(leaveDetail => {
            return Object.assign(leaveDetail, { leave_application_id: appHist.leave_application_id })
          });
          return leaveDetailModel.bulkCreate(leaveDetails, {transaction: t})
        }, {transaction: t})
      })
      .then(function () {
        res.status(200).json({ message: "Created successfully" })
        return t.commit();
      }).catch(function (err) {
        console.log(err)
        res.status(500).json({ message: "Some error occured" })
        return t.rollback();
      });
    })
  })

module.exports = router