
const router = require('express').Router()
const Op = require('sequelize').Op

const codes = require('../../global/codes');
const LeaveAppModel = require('../../model/leaveApplication.model')
const LeaveDetailModel = require('../../model/leaveDetail.model')
const EmployeeModel = require('../../model/employee.model')
const JoiningReport = require('../../model/joiningReport.model')

router.route('/:empCode')
  .get((req, res) => {
    LeaveAppModel.findAll({
      order: [['updated_at', 'ASC']],
      distinct: true,
      where: { status: codes.LEAVE_APPROVED },
      include: [
        {
          model: EmployeeModel,
          as: "leaveApplier",
          attributes: ['emp_code'],
          where: { emp_code: req.params.empCode }
        },
        {
          model: LeaveDetailModel,
          where: {
            leave_type: {
              [Op.or]: [codes.EL_CODE, codes.HPL_CODE]
            }
          }
        },
        {
          model: JoiningReport,
          where: { status: codes.JR_PENDING }
        }
      ]
    })
    .then(results => {
      if (!results) return res.status(200).json(null)

      console.log(JSON.stringify(results))
      let approved_leaves = results.map(result => {
        return Object.assign({},
          {
            id: result.id,
            emp_code: result.emp_code,
            joiningReport: result.joiningReport,
            leaveDetail: result.leaveDetails.map(leaveDetail => {
              return Object.assign({}, {
                leave_type: leaveDetail.leave_type,
                from_date: leaveDetail.from_date,
                to_date: leaveDetail.to_date
              })
            })[0]
          }
        )
      })

      return res.status(200).json(approved_leaves)
    })
    .catch(err => {
      console.log(err)
      return res.status(500).json({ message: 'Opps! Some error happened!!' })
    })
  })

module.exports = router