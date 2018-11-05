
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

    filterData(results).then(application => {
      let data = {
        rows: application,
        count: results.count
      }
      res.status(200).json(data)
    }) 
  })
  .catch(err => {
    console.log(err)
    res.status(500).json({ message: 'Opps! Some error happened!!' })
  })
})

router.route('/')
  .post((req, res) => {
    console.log("\nRequest\n",req.body)
    let leaveDetails = req.body.leave_details
    let prefix_from = req.body.prefix_from
    let prefix_to = req.body.prefix_to
    let suffix_from = req.body.suffix_from
    let suffix_to = req.body.suffix_to
    

    db.transaction().then(t => {
      return leaveAppModel.create({
        emp_code: req.body.emp_code,
        purpose: req.body.purpose,
        address: req.body.address,
        contact_no: req.body.contact_no,
        addressee: req.body.officer_emp_code,
        status: codes.LEAVE_APPLIED,
        prefix_from: (prefix_from && prefix_from.length > 0) ? prefix_from : null,
        prefix_to: (prefix_to && prefix_to.length > 0) ? prefix_to : null,
        suffix_from: (suffix_from && suffix_from.length > 0) ? suffix_from : null,
        suffix_to: (suffix_to && suffix_to.length > 0) ? suffix_to : null,
      }, {transaction: t})
      .then(app => {
        console.log(app)
        return leaveAppHistModel.create({
          leave_application_id: app.id,
          officer_emp_code: req.body.emp_code,
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

function filterData(results) {
  let promises = results.rows.map(async (result) => {
    let addressee = await findAdressee(result.addressee)
    return Object.assign({},
      {
        id: result.id,
        emp_code: result.emp_code,
        first_name: result.leaveApplier.first_name,
        last_name: result.leaveApplier.last_name,
        purpose: result.purpose,
        address: result.address,
        contact_no: result.contact_no,
        addressee: addressee,
        status: result.status,
        prefix_from: result.prefix_from,
        prefix_to: result.prefix_to,
        suffix_from: result.suffix_from,
        suffix_to: result.suffix_to,
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

  return Promise.all(promises).then(function(application) {
    console.log(application)
    return application
  })
}

function findAdressee(addressee) {
  return new Promise((resolve, reject) => {
    if(addressee && addressee.match(/00[0-9]{4}/)) {
      EmployeeModel.findOne({where: 
        {emp_code: addressee}
      })
      .then(data => {
        if(!data) return resolve("")

        let name = data.first_name + " " + data.last_name
        return resolve(name)
      })
      .catch(err => {
        console.log(err)
        return reject()
      })
    }
    else if(addressee == codes.RMAP_EL_HPL) {
      return resolve("EL/HPL ADMIN")
    } 
    else if(addressee == codes.HR_LEAVE_SUPER_ADMIN) {
      return resolve("EL/HPL Corporate")
    } 
    else {
      return resolve("")
    }
  })
}
  
module.exports = router

