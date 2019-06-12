const leaveAppModel = require('../../../../model/leave/leaveApplication.model')
const leaveDetailModel = require('../../../../model/leave/leaveDetail.model')
const codes = require('../../../../global/codes');
const Op = require('sequelize').Op

//This function retrieves all leaves that has not been cancelled 
//or callbacked by the concerned employee (i.e the leave owner)
const getLeavesAlreadyApplied = (req, res) => {
  return leaveAppModel.findAll({
    distinct: true,
    where: {
      //if emp code is specified in request params, else take the current logged in employee code
      emp_code: req.params.empCode ? req.params.empCode : req.user.emp_code,
      [Op.or]: [{ 
          addressee: { [Op.not]: null },
          status: {
            [Op.notIn]: [
              codes.LEAVE_CANCELLED,
              codes.LEAVE_NOT_RECOMMENDED
            ] 
          }
        }, {
          addressee: null,
          status: {
            [Op.notIn]: [
              codes.LEAVE_CALLBACKED,
              codes.LEAVE_CANCELLED,
              codes.LEAVE_NOT_RECOMMENDED
            ] 
          }
        }
      ]
    }, 
    include: [{ model: leaveDetailModel }]
  })
  .then((results) => {
    if (!results) return []

    let data = [] 
    results.forEach(row => {
      row.leaveDetails.forEach(leave => data.push(leave))
    })

    return data
  })
  .catch(err => {
    console.log(err)
    return res.status(500).json({ message: 'Opps! Some error happened!!', error: err })
  })
}

module.exports = getLeavesAlreadyApplied