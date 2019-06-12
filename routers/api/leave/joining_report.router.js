
const router = require('express').Router()
const Op = require('sequelize').Op

const codes = require('../../../global/codes');
const LeaveAppModel = require('../../../model/leave/leaveApplication.model')
const LeaveDetailModel = require('../../../model/leave/leaveDetail.model')
const EmployeeModel = require('../../../model/shared/employee.model')
const JoiningReport = require('../../../model/leave/joiningReport.model')
const checkRole = require('./check_roles')

router.route('/employee/:empCode')
  .get((req, res) => {
    LeaveAppModel.findAll({
      order: [['updated_at', 'ASC']],
      distinct: true,
      where: { status: codes.LEAVE_APPROVED },
      include: [
        {
          model: EmployeeModel,
          as: "leaveApplier",
          attributes: ['emp_code', 'first_name', 'last_name'],
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
          where: { 
            status:  {
              [Op.or]: [codes.JR_PENDING, codes.JR_SUBMITTED, codes.JR_RECOMMENDED, codes.JR_CALLBACK] 
            }
          }
        }
      ]
    })
    .then(results => {
      if (!results) return res.status(200).json(null)
      filterData(results, req, res)
    })
    .catch(err => {
      console.log(err)
      return res.status(500).json({ message: 'Opps! Some error happened!!' })
    })
  })

  router.route('/pending/:empCode')
  .get(async (req, res) => {
    let condition = await getQueryCondition(req, res)
    LeaveAppModel.findAll({
      order: [['updated_at', 'ASC']],
      distinct: true,
      where: { status: codes.LEAVE_APPROVED },
      include: [
        {
          model: EmployeeModel,
          as: "leaveApplier",
          attributes: ['emp_code', 'first_name', 'last_name'],
          where: { 
            project_id: condition.project_id 
          }
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
          where: { 
            status: {
              [Op.or]: [codes.JR_SUBMITTED, codes.JR_RECOMMENDED ]
            },
            addressee: condition.addressee 
          }
        }
      ]
    })
    .then(results => {
      if (!results) return res.status(200).json(null)
      filterData(results, req, res)
    })
    .catch(err => {
      console.log(err)
      return res.status(500).json({ message: 'Opps! Some error happened!!' })
    })
  })  

router.route('/leave-application/:leaveId')
  .put((req, res) => {
    JoiningReport.update({ 
        addressee: req.body.addressee, 
        status: req.body.status, 
        comment: req.body.comment,
        joining_date: req.body.joining_date,
        session: req.body.session,
      }, { 
        where: { leave_application_id: req.params.leaveId } 
      }
    )
    .then(() => {
      JoiningReport.findOne({ 
        where: { leave_application_id: req.params.leaveId }
      })
      .then(result => res.status(200).json(result))
      .catch(err =>{
        console.log(err) 
        res.status(500).json({message:'Opps! Some error happened!!'})
      })
    })
    .catch(err=>{
      console.log(err)
      res.status(500).json({message:'Opps! Some error happened!!'})
    })
  })  

async function getQueryCondition(req, res) {
  let el_hpl_role = await checkRole.checkElHplRole(req, res)
  let leave_super_admin_role = await checkRole.checkLeaveSuperAdminRole(req, res)

  if(leave_super_admin_role) {
    return { 
      addressee: { 
        [Op.or]: [leave_super_admin_role.role, req.params.empCode]
      },
      project_id: {
        [Op.like]: "%"
      }
    }
  }
  else if(el_hpl_role){
    return { 
      addressee: { 
        [Op.or]: [el_hpl_role.role, req.params.empCode]
      },
      project_id: {
        [Op.like]: "%" + el_hpl_role.project_id
      }
    }
  }
  else {
    return { 
      addressee: req.params.empCode,
      project_id: {
        [Op.like]: "%"
      }
    }
  }
}  

function filterData(results, req, res) {
  console.log(JSON.stringify(results))
  let approved_leaves = results.map(result => {
  return Object.assign({},
    {
      id: result.id,
      emp_code: result.emp_code,
      first_name: result.leaveApplier.first_name,
      last_name: result.leaveApplier.last_name,
      joiningReport: result.joiningReport,
      prefix_from: result.prefix_from,
      prefix_to: result.prefix_to,
      suffix_from: result.suffix_from,
      suffix_to: result.suffix_to,
      created_at: result.created_at,
      leaveDetails: result.leaveDetails.map(leaveDetail => {
        return Object.assign({}, {
          leave_type: leaveDetail.leave_type,
          from_date: leaveDetail.from_date,
          to_date: leaveDetail.to_date
        })
      })
    })
  })

  return res.status(200).json(approved_leaves)
}  


module.exports = router