const router = require('express').Router();
const Op = require('sequelize').Op;

const leaveAppModel = require('../../../model/leaveApplication.model');
const leaveDetailModel = require('../../../model/leaveDetail.model');
const leaveAppHistModel = require('../../../model/leaveApplicationHist.model');
const leaveLedgerModel = require('../../../model/leaveLedger.model');
const employeeModel = require('../../../model/employee.model');
const joiningReportModel = require('../../../model/joiningReport.model');
const Codes = require('../../../global/codes');
const db = require('../../../config/db');
const checkRole = require('./check_roles');

router.route('/officer/:empCode/count')
  .get(async (req, res) => { 
    let condition = await getQueryCondition(req, res)
      
    leaveAppModel.count({
      where: {
        addressee: condition.addressee
      },
      include: [{
        model: employeeModel,
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
          model: employeeModel,
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
              model: employeeModel,
              as: "officer",
              attributes: ['emp_code', 'first_name', 'last_name'],
            }
          ]
        },
        { model: joiningReportModel },
        { model: leaveDetailModel }
      ]
    })
    .then(results => {
      filterData(req, res, results)
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

    if(action == Codes.LEAVE_CANCEL_INITIATION) {
      leaveCancelInitiation(req, res)
    }

    if(action == Codes.LEAVE_CANCEL_CALLBACKED) {
      leaveCancelCallback(req, res)
    }

    if(action == Codes.LEAVE_CANCEL_RECOMMENDED) {
      leaveCancelRecommended(req, res)
    }

    if(action == Codes.LEAVE_CANCEL_NOT_RECOMMENDED) {
      leaveCancelNotRecommended(req, res)
    }
  });

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
        model: employeeModel,
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
            model: employeeModel,
            as: "officer",
            attributes: ['emp_code', 'first_name', 'last_name'],
          }
        ]
      },
      { model: joiningReportModel },
      { model: leaveDetailModel }
    ]
  })
  .then(results => {
    filterData(req, res, results)
  })
  .catch(err => {
    console.log(err)
    return res.status(500).json({ message: 'Opps! Some error happened!!' })
  })
}

//Leave is not recommended
function leaveNotRecommended(req, res) {
  let status = Codes.LEAVE_NOT_RECOMMENDED
  let addressee = null
  processLeaveWorkflowAction(req, res, status, addressee)
}

//Leave is recommended
function leaveRecommended(req, res) {
  let status = Codes.LEAVE_RECOMMENDED
  let addressee = req.body.addressee
  processLeaveWorkflowAction(req, res, status, addressee)
}

//Leave callback process
function leaveCallback(req, res) {
  processCallbackAction(req, res, Codes.LEAVE_CALLBACKED)
}

function leaveApprove(req, res) {
  db.transaction().then(t => {
    leaveAppModel.find({
      where: { id: req.params.leaveAppId },
      include: { model: leaveDetailModel } 
    }, { transaction: t })
    
    .then(result => {
      // console.log(JSON.stringify(result.leaveDetails))
      return leaveAppHistModel.create({
        leave_application_id: req.params.leaveAppId,
        remarks: req.body.remarks,
        officer_emp_code: req.body.officer_emp_code,
        workflow_action: req.body.workflow_action,
      }, { transaction: t })
      
      .then(() => {
        let el_hpl = result.leaveDetails.filter(leave => {
          let type = leave.leave_type
          return type === Codes.EL_CODE || type === Codes.HPL_CODE 
        })
        //if leave type is not EL or HPL return
        if(!el_hpl) return Promise.resolve() 
  
        //insert in to joining report table if EL or HPL leave type
        return joiningReportModel.create({
          status: Codes.JR_PENDING,
          leave_application_id: req.params.leaveAppId
        }, 
        { transaction: t})
  
      })
      .then(() => {
        let no_of_cl = result.leaveDetails.filter(leaveDetail => leaveDetail.leave_type === Codes.CL_CODE).length
        let no_of_rh = result.leaveDetails.filter(leaveDetail => leaveDetail.leave_type === Codes.RH_CODE).length
        let no_of_hd_cl = (result.leaveDetails.filter(leaveDetail => leaveDetail.leave_type === Codes.HD_CL_CODE).length)/2
        
        let remarks = "Leave Approved for leave application " + req.params.leaveAppId

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

        let curr_year = (new Date()).getFullYear()
        //Insert in to ledger table
        return insertLeaveLedger(curr_year, "D", no_of_cl, Codes.CL_CODE, result.emp_code, remarks, t)
          .then(() => insertLeaveLedger(curr_year, "D", no_of_hd_cl, Codes.CL_CODE, result.emp_code, remarks, t))
          .then(() => insertLeaveLedger(curr_year, "D", no_of_rh, Codes.RH_CODE, result.emp_code, remarks, t))
          .then(() => insertLeaveLedger(curr_year, "D", no_of_el, Codes.EL_CODE, result.emp_code, remarks, t))
          .then(() => insertLeaveLedger(curr_year, "D", no_of_hpl, Codes.HPL_CODE, result.emp_code, remarks, t))
      })
      .then(() => {
        //Update leave application status
        return leaveAppModel.update(
          { status: Codes.LEAVE_APPROVED, addressee: null }, 
          { where: { id: req.params.leaveAppId }
        }, 
        { transaction: t })
      })
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
      // console.log(JSON.stringify(result.leaveDetails))
      return leaveAppHistModel.create({
        leave_application_id: req.params.leaveAppId,
        remarks: req.body.remarks,
        officer_emp_code: req.body.officer_emp_code,
        workflow_action: req.body.workflow_action,
      }, { transaction: t })
      .then(() => {
        let el_hpl = result.leaveDetails.filter(leave => {
          let type = leave.leave_type
          return type === Codes.EL_CODE || type === Codes.HPL_CODE 
        })
        //if leave type is not EL or HPL return
        if(!el_hpl) return Promise.resolve() 
  
        return joiningReportModel.destroy({
          where: { leave_application_id: req.params.leaveAppId }
        }, { transaction: t })
      })
      .then(() => {
        let no_of_cl = result.leaveDetails.filter(leaveDetail => leaveDetail.leave_type === Codes.CL_CODE).length
        let no_of_rh = result.leaveDetails.filter(leaveDetail => leaveDetail.leave_type === Codes.RH_CODE).length
        let no_of_hd_cl = (result.leaveDetails.filter(leaveDetail => leaveDetail.leave_type === Codes.HD_CL_CODE).length)/2
        
        let remarks = "Leave Cancelled for leave application " + req.params.leaveAppId

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

        let curr_year = (new Date()).getFullYear()
        //Insert in to ledger table
        return insertLeaveLedger(curr_year, "C", no_of_cl, Codes.CL_CODE, result.emp_code, remarks, t)
          .then(() => insertLeaveLedger(curr_year, "C", no_of_hd_cl, Codes.CL_CODE, result.emp_code, remarks, t))
          .then(() => insertLeaveLedger(curr_year, "C", no_of_rh, Codes.RH_CODE, result.emp_code, remarks, t))
          .then(() => insertLeaveLedger(curr_year, "C", no_of_el, Codes.EL_CODE, result.emp_code, remarks, t))
          .then(() => insertLeaveLedger(curr_year, "C", no_of_hpl, Codes.HPL_CODE, result.emp_code, remarks, t))
      })
      .then(() => {
        return leaveAppModel.update(
          { status: Codes.LEAVE_CANCELLED, addressee: null }, 
          { where: { id: req.params.leaveAppId }
        }, 
        { transaction: t })
      })
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

//Leave cancellation Initialization
function leaveCancelInitiation(req, res) {
  let status = Codes.LEAVE_CANCEL_INITIATION
  let addressee = req.body.addressee
  processLeaveWorkflowAction(req, res, status, addressee)
}

//Leave cancellation not recommended
function leaveCancelNotRecommended(req, res) {
  let status = Codes.LEAVE_CANCEL_NOT_RECOMMENDED
  let addressee = null
  processLeaveWorkflowAction(req, res, status, addressee)
}

//Leave cancellation recommended
function leaveCancelRecommended(req, res) {
  let status = Codes.LEAVE_CANCEL_RECOMMENDED
  let addressee = req.body.addressee
  processLeaveWorkflowAction(req, res, status, addressee)
}

//Leave cancellation callback
function leaveCancelCallback(req, res) {
  processCallbackAction(req, res, Codes.LEAVE_CANCEL_CALLBACKED)
}

function processCallbackAction(req, res, status) {
  //Fetch current user
  let user = req.user
  db.transaction().then(t => {
    leaveAppModel.find({
      where: { id: req.params.leaveAppId }
    }, { transaction: t })

    .then(result => {
      return leaveAppHistModel.create({
        leave_application_id: req.params.leaveAppId,
        remarks: req.body.remarks,
        officer_emp_code: req.body.officer_emp_code,
        workflow_action: req.body.workflow_action,
      }, {transaction: t})
      
      .then(() => {
        return leaveAppModel.update({ 
            status: status, 
            addressee: (user && user.emp_code == result.emp_code) ? null : req.body.officer_emp_code
          }, 
          { where: { id: req.params.leaveAppId }}, 
          { transaction: t }
        );
      })
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

function processLeaveWorkflowAction(req, res, status, addressee) {
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
          status: status, 
          addressee: addressee
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

function insertLeaveLedger(cal_year, db_cr_flag, no_of_days, leave_type, emp_code, remarks, t) {
  // console.log("no of days:", no_of_days)
  //--- Check leave balance ---
  if(no_of_days < .5) return Promise.resolve()
 
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

function filterData(req, res, results) {
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
        suffix_from: result.suffix_from,
        suffix_to: result.suffix_to,
        created_at: result.created_at,
        joiningReport: result.joiningReport,

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
}

module.exports = router