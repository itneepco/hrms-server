const router = require('express').Router()
const leaveAppModel = require('../../../model/leaveApplication.model')
const leaveDetailModel = require('../../../model/leaveDetail.model')
const codes = require('../../../global/codes');
const Op = require('sequelize').Op

router.route('/employee/:empCode')
.get((req, res) => { 
  leaveAppModel.findAll({
    distinct: true,
    where: {
      emp_code: req.params.empCode,
      status: {
        [Op.notIn]: [
          codes.LEAVE_CALLBACKED,
          codes.LEAVE_CANCELLED
        ] 
      }
    }, 
    include: [
      { model: leaveDetailModel }
    ]
  })
  .then((results) => {
    if (!results) return res.status(200).json(null)

    let data = [] 
    results.forEach(row => {
      row.leaveDetails.forEach(leave => data.push(leave))
    })
    res.status(200).json({
      emp_code: req.params.empCode,
      leaves: data
    })
  })
  .catch(err => {
    console.log(err)
    res.status(500).json({ message: 'Opps! Some error happened!!', error: err })
  })
})

module.exports = router