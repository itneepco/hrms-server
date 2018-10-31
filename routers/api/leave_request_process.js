const router = require('express').Router()
const Op = require('sequelize').Op;

const leaveAppModel = require('../../model/leaveApplication.model')
const leaveDetailModel = require('../../model/leaveDetail.model')
const leaveAppHistModel = require('../../model/leaveApplicationHist.model')
const leaveLedgerModel = require('../../model/leaveLedger.model')
const EmployeeModel = require('../../model/employee.model');
const roleMapperModel = require('../../model/roleMapper.model');
const Codes = require('../../global/codes')
const db = require('../../config/db');

router.route('/officer/:empCode/count')
  .get(async (req, res) => { 
    let condition = await getQueryCondition(req, res)
      
    leaveAppModel.count({
      where: {
        addressee: condition.addressee
      },
      include: [{
        model: EmployeeModel,
        as: "leaveApplier",
        attributes: ['first_name', 'last_name'],
        where: {
          project_id: condition.project_id
        }
      }]
    })
    .then(result => {
      res.status(200).json(result)
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ message: 'Opps! Some error happened!!' })
    })
  })

router.route('/officer/:empCode')
  .get(async (req, res) => {
    fetchLeaveApplication(req, res)
  })

router.route('/officer/:empCode/processed')
  .get((req, res) => {
    let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0
    let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50
    let offset = pageIndex * limit

    leaveAppModel.findAndCountAll({
      order: [['updated_at', 'DESC']],
      distinct: true,
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
          as: "leaveProcessor",
          where: {
            officer_emp_code: req.params.empCode,
            workflow_action: {
              [Op.or]: [Codes.LEAVE_RECOMMENDED, Codes.LEAVE_APPROVED, Codes.LEAVE_NOT_RECOMMENDED]
            }
          },
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

      console.log(JSON.stringify(results))
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
            addressee: result.addressee ,
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


router.route('/:leaveAppId/actions')
  .post((req, res) => {
    let action = req.body.workflow_action
    if (action === Codes.LEAVE_APPROVED) { 
      leaveApprove(req, res)
    }
  
    if(action === Codes.LEAVE_NOT_RECOMMENDED) {
      leaveNotRecommended(req, res)
    }

    if(action === Codes.LEAVE_RECOMMENDED) {
      leaveRecommended(req, res)
    }
 
    if(action === Codes.LEAVE_CALLBACKED) {
      leaveCallback(req, res)
    }

    if(action === Codes.LEAVE_CANCELLED) {
      leaveCancel(req, res)
    }
  });

function checkElHplRole(req, res) {
  return roleMapperModel.findOne({
    where: {
      emp_code: req.params.empCode,
      role: Codes.RMAP_EL_HPL
    }
  })
  .then(roleMapper => {
    if (!roleMapper) return null
    
    return roleMapper
  })
  .catch(err => {
    console.log(err)
    return null
  })
}

function checkLeaveSuperAdminRole(req, res) {
  return roleMapperModel.findOne({
    where: {
      emp_code: req.params.empCode,
      role: Codes.HR_LEAVE_SUPER_ADMIN
    }
  })
  .then(roleMapper => {
    if (!roleMapper) return null
    
    return roleMapper
  })
  .catch(err => {
    console.log(err)
    return null
  })
}

async function fetchLeaveApplication(req, res) {
  let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0
  let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50
  let offset = pageIndex * limit

  let condition = await getQueryCondition(req, res)
  
  return leaveAppModel.findAndCountAll({
    order: [['updated_at', 'DESC']],
    distinct: true,
    limit: limit,
    offset: offset,
    where: {
      addressee: condition.addressee
    },
    include: [
      {
        model: EmployeeModel,
        as: "leaveApplier",
        attributes: ['first_name', 'last_name'],
        where: {
          project_id: condition.project_id
        }
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

    console.log(JSON.stringify(results))
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
      rows: leave_request,
      count: results.count
    }
    return  res.status(200).json(data)
  })
  .catch(err => {
    console.log(err)
    return res.status(500).json({ message: 'Opps! Some error happened!!' })
  })
}

function leaveNotRecommended(req, res) {
  db.transaction().then(t => {
    return leaveAppHistModel.create({
      leave_application_id: req.params.leaveAppId,
      remarks: req.body.remarks,
      officer_emp_code: req.body.officer_emp_code,
      workflow_action: req.body.workflow_action,
    }, {transaction: t})
    
    .then(() => {
      return leaveAppModel.update({ 
          status: Codes.LEAVE_NOT_RECOMMENDED, 
          addressee: null
        }, 
        { where: { id: req.params.leaveAppId }
      }, {transaction: t});
    })
    .then(function () {
      res.status(200).json({message: "Leave request processed successful"})
      return t.commit();
    }).catch(function (err) {
      res.status(500).json({message: "Leave request processed unsuccessful"})
      console.log(err)
      return t.rollback();
    });     
  })
}

function leaveRecommended(req, res) {
  db.transaction().then(t => {
    return leaveAppHistModel.create({
      leave_application_id: req.params.leaveAppId,
      remarks: req.body.remarks,
      officer_emp_code: req.body.officer_emp_code,
      workflow_action: req.body.workflow_action,
    }, {transaction: t})
    
    .then(() => {
      return leaveAppModel.update(
        { 
          status: Codes.LEAVE_RECOMMENDED, 
          addressee: req.body.addressee
        }, 
        { where: { id: req.params.leaveAppId }
      }, { transaction: t });
    })
    .then(function () {
      res.status(200).json({message: "Leave request processed successful"})
      return t.commit();
    })
    .catch(function (err) {
      res.status(500).json({message: "Leave request processed unsuccessful"})
      console.log(err)
      return t.rollback();
    });     
  })
}

function leaveCallback(req, res) {
  db.transaction().then(t => {
    return leaveAppHistModel.create({
      leave_application_id: req.params.leaveAppId,
      remarks: req.body.remarks,
      officer_emp_code: req.body.officer_emp_code,
      workflow_action: req.body.workflow_action,
    }, {transaction: t})
    
    .then(() => {
      return leaveAppModel.update({ 
          status: Codes.LEAVE_CALLBACKED, 
          addressee: req.body.officer_emp_code
        }, 
        { where: { id: req.params.leaveAppId }
      }, { transaction: t });
    })
    .then(function () {
      res.status(200).json({message: "Leave request processed successful"})
      return t.commit();
    })
    .catch(function (err) {
      res.status(500).json({message: "Leave request processed unsuccessful"})
      console.log(err)
      return t.rollback();
    });     
  })
}

function leaveApprove(req, res) {
  db.transaction().then(t => {
    leaveAppModel.find({
      where: { id: req.params.leaveAppId },
      include: { model: leaveDetailModel } 
    }, { transaction: t })
    
    .then(result => {
      console.log(JSON.stringify(result.leaveDetails))
      return leaveAppHistModel.create({
        leave_application_id: req.params.leaveAppId,
        remarks: req.body.remarks,
        officer_emp_code: req.body.officer_emp_code,
        workflow_action: req.body.workflow_action,
      }, {transaction: t})

      .then(() => {
        let no_of_cl = result.leaveDetails.filter(leaveDetail => leaveDetail.leave_type === Codes.CL_CODE).length
        let no_of_rh = result.leaveDetails.filter(leaveDetail => leaveDetail.leave_type === Codes.RH_CODE).length
        let no_of_hd_cl = (result.leaveDetails.filter(leaveDetail => leaveDetail.leave_type === Codes.HD_CL_CODE).length)/2
        
        let remarks = "Leave Approved"

        //Calculate no of EL days
        let no_of_el = 0
        if(result.leaveDetails[0].leave_type === Codes.EL_CODE) {
          let from_date = new Date(result.leaveDetails[0].from_date)
          let to_date = new Date(result.leaveDetails[0].to_date)
          
          no_of_el = ((to_date - from_date) / (60*60*24*1000)) + 1
        }

        //Calculate no of HPL days
        let no_of_hpl = 0
        if(result.leaveDetails[0].leave_type === Codes.HPL_CODE) {
          let from_date = new Date(result.leaveDetails[0].from_date)
          let to_date = new Date(result.leaveDetails[0].to_date)
          
          no_of_hpl = ((to_date - from_date) / (60*60*24*1000)) + 1
        }

        //Insert in to ledger table
        return insertLeaveLedger("2018", "D", no_of_cl, Codes.CL_CODE, result.emp_code, remarks, t)
          .then(() => insertLeaveLedger("2018", "D", no_of_hd_cl, Codes.CL_CODE, result.emp_code, remarks, t))
          .then(() => insertLeaveLedger("2018", "D", no_of_rh, Codes.RH_CODE, result.emp_code, remarks, t))
          .then(() => insertLeaveLedger("2018", "D", no_of_el, Codes.EL_CODE, result.emp_code, remarks, t))
          .then(() => insertLeaveLedger("2018", "D", no_of_hpl, Codes.HPL_CODE, result.emp_code, remarks, t))
      })
    })
    .then(() => {
      return leaveAppModel.update(
        { status: Codes.LEAVE_APPROVED, addressee: null }, 
        { where: { id: req.params.leaveAppId }
      }, 
      { transaction: t })
    })
    .then(function () {
      res.status(200).json({message: "Leave request processed successful"})
      return t.commit();
    })
    .catch(function (err) {
      res.status(500).json({message: "Leave request processed unsuccessful"})
      console.log(err)
      return t.rollback();
    });
  })
}

function leaveCancel(req, res) {
  db.transaction().then(t => {
    leaveAppModel.find({
      where: { id: req.params.leaveAppId },
      include: { model: leaveDetailModel } 
    }, { transaction: t })
    
    .then(result => {
      console.log(JSON.stringify(result.leaveDetails))
      return leaveAppHistModel.create({
        leave_application_id: req.params.leaveAppId,
        remarks: req.body.remarks,
        officer_emp_code: req.body.officer_emp_code,
        workflow_action: req.body.workflow_action,
      }, {transaction: t})

      .then(() => {
        let no_of_cl = result.leaveDetails.filter(leaveDetail => leaveDetail.leave_type === Codes.CL_CODE).length
        let no_of_rh = result.leaveDetails.filter(leaveDetail => leaveDetail.leave_type === Codes.RH_CODE).length
        let no_of_hd_cl = (result.leaveDetails.filter(leaveDetail => leaveDetail.leave_type === Codes.HD_CL_CODE).length)/2
        
        let remarks = "Leave Cancelled"

        //Calculate no of EL days
        let no_of_el = 0
        if(result.leaveDetails[0].leave_type === Codes.EL_CODE) {
          let from_date = new Date(result.leaveDetails[0].from_date)
          let to_date = new Date(result.leaveDetails[0].to_date)
          
          no_of_el = ((to_date - from_date) / (60*60*24*1000)) + 1
        }

        //Calculate no of HPL days
        let no_of_hpl = 0
        if(result.leaveDetails[0].leave_type === Codes.HPL_CODE) {
          let from_date = new Date(result.leaveDetails[0].from_date)
          let to_date = new Date(result.leaveDetails[0].to_date)
          
          no_of_hpl = ((to_date - from_date) / (60*60*24*1000)) + 1
        }

        //Insert in to ledger table
        return insertLeaveLedger("2018", "C", no_of_cl, Codes.CL_CODE, result.emp_code, remarks, t)
          .then(() => insertLeaveLedger("2018", "C", no_of_hd_cl, Codes.CL_CODE, result.emp_code, remarks, t))
          .then(() => insertLeaveLedger("2018", "C", no_of_rh, Codes.RH_CODE, result.emp_code, remarks, t))
          .then(() => insertLeaveLedger("2018", "C", no_of_el, Codes.EL_CODE, result.emp_code, remarks, t))
          .then(() => insertLeaveLedger("2018", "C", no_of_hpl, Codes.HPL_CODE, result.emp_code, remarks, t))
      })
    })
    .then(() => {
      return leaveAppModel.update(
        { status: Codes.LEAVE_CANCELLED, addressee: null }, 
        { where: { id: req.params.leaveAppId }
      }, 
      { transaction: t })
    })
    .then(function () {
      res.status(200).json({message: "Leave request processed successful"})
      return t.commit();
    })
    .catch(function (err) {
      res.status(500).json({message: "Leave request processed unsuccessful"})
      console.log(err)
      return t.rollback();
    });
  })
}

function insertLeaveLedger(cal_year, db_cr_flag, no_of_days, leave_type, emp_code, remarks, t) {
  console.log("no of days:", no_of_days)
  if(no_of_days < .5) return Promise.resolve()
 //--- Check leave balance ---
  return leaveLedgerModel.create({
    cal_year: cal_year,
    db_cr_flag: db_cr_flag,
    no_of_days: no_of_days,
    leave_type: leave_type,
    emp_code: emp_code,
    remarks: remarks
  }, { transaction: t })
}

async function getQueryCondition(req, res) {
  let el_hpl_role = await checkElHplRole(req, res)
  let leave_super_admin_role = await checkLeaveSuperAdminRole(req, res)

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

module.exports = router