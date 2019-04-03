const router = require('express').Router()
const leaveAppModel = require('../../../model/leaveApplication.model')
const leaveDetailModel = require('../../../model/leaveDetail.model')
const leaveAppHistModel = require('../../../model/leaveApplicationHist.model')
const employeeModel = require('../../../model/employee.model');
const joiningReportModel = require('../../../model/joiningReport.model');

const codes = require('../../../global/codes');
const db = require('../../../config/db');

router.get('/employee/:empCode', (req, res) => { 
  leaveAppModel.findAll({
    where: {
      emp_code: req.params.emp_code,
      distinct: true
    }, 
    include: [
      { model: leaveDetailModel }
    ]
  })
  .then((results) => {
    if (!results) return res.status(200).json(null)

    console.log(results)
  })
  .catch(err => {
    console.log(err)
    res.status(500).json({ message: 'Opps! Some error happened!!', error: err })
  })

})