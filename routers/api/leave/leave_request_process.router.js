const router = require("express").Router();
const Op = require("sequelize").Op;

const leaveAppModel = require("../../../model/leave/leaveApplication.model");
const leaveDetailModel = require("../../../model/leave/leaveDetail.model");
const leaveAppHistModel = require("../../../model/leave/leaveApplicationHist.model");
const leaveLedgerModel = require("../../../model/leave/leaveLedger.model");
const employeeModel = require("../../../model/shared/employee.model");
const joiningReportModel = require("../../../model/leave/joiningReport.model");
const absentDetailModel = require("../../../model/attendance/absentDetail.model");

const Codes = require("../../../global/codes");
const db = require("../../../config/db");
const checkRole = require("./check_roles");

router.route("/officer/:empCode/count").get(async (req, res) => {
  let condition = await getQueryCondition(req, res);

  leaveAppModel
    .count({
      where: {
        addressee: condition.addressee
      },
      include: [
        {
          model: employeeModel,
          as: "leaveApplier",
          attributes: ["first_name", "last_name"],
          where: {
            project_id: condition.project_id
          }
        }
      ]
    })
    .then(result => {
      res.status(200).json(result);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: "Opps! Some error happened!!" });
    });
});

router.route("/officer/:empCode").get(async (req, res) => {
  fetchLeaveApplication(req, res);
});

router.route("/officer/:empCode/processed").get((req, res) => {
  let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0;
  let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50;
  let offset = pageIndex * limit;

  leaveAppModel
    .findAndCountAll({
      order: [["created_at", "DESC"]],
      distinct: true,
      limit: limit,
      offset: offset,
      include: [
        {
          model: employeeModel,
          as: "leaveApplier",
          attributes: ["first_name", "last_name"]
        },
        {
          model: leaveAppHistModel,
          as: "leaveProcessor",
          where: {
            officer_emp_code: req.params.empCode,
            workflow_action: {
              [Op.or]: [
                Codes.LEAVE_RECOMMENDED,
                Codes.LEAVE_APPROVED,
                Codes.LEAVE_NOT_RECOMMENDED
              ]
            }
          }
        },
        {
          model: leaveAppHistModel,
          include: [
            {
              model: employeeModel,
              as: "officer",
              attributes: ["emp_code", "first_name", "last_name"]
            }
          ]
        },
        { model: joiningReportModel },
        { model: leaveDetailModel }
      ]
    })
    .then(results => {
      filterData(req, res, results);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: "Opps! Some error happened!!" });
    });
});

router.route("/:leaveAppId/actions").post((req, res) => {
  let action = req.body.workflow_action;
  if (action === Codes.LEAVE_APPROVED) {
    leaveApprove(req, res);
  }

  if (action === Codes.LEAVE_NOT_RECOMMENDED) {
    leaveNotRecommended(req, res);
  }

  if (action === Codes.LEAVE_RECOMMENDED) {
    leaveRecommended(req, res);
  }

  if (action === Codes.LEAVE_CALLBACKED) {
    leaveCallback(req, res);
  }

  if (action === Codes.LEAVE_CANCELLED) {
    leaveCancel(req, res);
  }

  if (action == Codes.LEAVE_CANCEL_INITIATION) {
    leaveCancelInitiation(req, res);
  }

  if (action == Codes.LEAVE_CANCEL_CALLBACKED) {
    leaveCancelCallback(req, res);
  }

  if (action == Codes.LEAVE_CANCEL_RECOMMENDED) {
    leaveCancelRecommended(req, res);
  }

  if (action == Codes.LEAVE_CANCEL_NOT_RECOMMENDED) {
    leaveCancelNotRecommended(req, res);
  }
});

//Leave is not recommended
function leaveNotRecommended(req, res) {
  let status = Codes.LEAVE_NOT_RECOMMENDED;
  let addressee = null;
  processLeaveWorkflowAction(req, res, status, addressee);
}

//Leave is recommended
function leaveRecommended(req, res) {
  let status = Codes.LEAVE_RECOMMENDED;
  let addressee = req.body.addressee;
  processLeaveWorkflowAction(req, res, status, addressee);
}

//Leave callback process
function leaveCallback(req, res) {
  processCallbackAction(req, res, Codes.LEAVE_CALLBACKED);
}

function leaveApprove(req, res) {
  leaveApproveCancel(req, res, "D");
}

function leaveCancel(req, res) {
  leaveApproveCancel(req, res, "C");
}

//Leave cancellation Initialization
function leaveCancelInitiation(req, res) {
  let status = Codes.LEAVE_CANCEL_INITIATION;
  let addressee = req.body.addressee;
  processLeaveWorkflowAction(req, res, status, addressee);
}

//Leave cancellation not recommended
function leaveCancelNotRecommended(req, res) {
  let status = Codes.LEAVE_CANCEL_NOT_RECOMMENDED;
  let addressee = null;
  processLeaveWorkflowAction(req, res, status, addressee);
}

//Leave cancellation recommended
function leaveCancelRecommended(req, res) {
  let status = Codes.LEAVE_CANCEL_RECOMMENDED;
  let addressee = req.body.addressee;
  processLeaveWorkflowAction(req, res, status, addressee);
}

//Leave cancellation callback
function leaveCancelCallback(req, res) {
  processCallbackAction(req, res, Codes.LEAVE_CANCEL_CALLBACKED);
}

async function leaveApproveCancel(req, res, db_cr_flag) {
  let transaction;

  try {
    const leaveApp = await leaveAppModel.find({
      where: { id: req.params.leaveAppId },
      include: [
        { model: leaveDetailModel },
        { model: employeeModel, as: "leaveApplier" }
      ]
    });

    if (!leaveApp) {
      res.status(500).json({ message: "Leave application not found" });
      return;
    }

    const cl_arr = leaveApp.leaveDetails.filter(
      leaveDetail => leaveDetail.leave_type === Codes.CL_CODE
    );
    const rh_arr = leaveApp.leaveDetails.filter(
      leaveDetail => leaveDetail.leave_type === Codes.RH_CODE
    );
    const hd_cl_arr = leaveApp.leaveDetails.filter(
      leaveDetail => leaveDetail.leave_type === Codes.HD_CL_CODE
    );
    const el_arr = leaveApp.leaveDetails.filter(
      leaveDetail => leaveDetail.leave_type === Codes.EL_CODE
    );
    const hpl_arr = leaveApp.leaveDetails.filter(
      leaveDetail => leaveDetail.leave_type === Codes.HPL_CODE
    );

    //Calculate no of CL days
    const no_of_cl = cl_arr.length;

    //Calculate no of RH days
    const no_of_rh = rh_arr.length;

    //Calculate no of HD CL days
    const no_of_hd_cl = hd_cl_arr.length / 2;

    //Calculate no of EL days
    let no_of_el = 0;
    if (el_arr.length > 0) {
      let from_date = new Date(el_arr[0].from_date);
      let to_date = new Date(el_arr[0].to_date);

      no_of_el = (to_date - from_date) / (60 * 60 * 24 * 1000) + 1;
    }

    //Calculate no of HPL days
    let no_of_hpl = 0;
    if (hpl_arr.length > 0) {
      let from_date = new Date(hpl_arr[0].from_date);
      let to_date = new Date(hpl_arr[0].to_date);

      no_of_hpl = (to_date - from_date) / (60 * 60 * 24 * 1000) + 1;
    }

    // Get current year
    const curr_year = new Date().getFullYear();

    /**************************************************************************************
     * Transaction starts
     ************************************************************************************* */
    transaction = await db.transaction({ autocommit: false });

    await leaveAppHistModel.create(
      {
        leave_application_id: req.params.leaveAppId,
        remarks: req.body.remarks,
        officer_emp_code: req.body.officer_emp_code,
        workflow_action: req.body.workflow_action
      },
      { transaction }
    );

    //if leave type is EL or HPL
    if (el_arr.length > 0 || hpl_arr.length > 0) {
      // Insert in to joining report table if EL or HPL leave type
      await joiningReportModel.create(
        {
          status: Codes.JR_PENDING,
          leave_application_id: req.params.leaveAppId
        },
        { transaction }
      );
    }

    // Calculate Remarks
    let remarks, status;
    if (db_cr_flag == "D") {
      remarks = "Leave Approved for leave application " + leaveApp.id;
      status = Codes.LEAVE_APPROVED;
    } else {
      remarks = "Leave Cancelled for leave application " + leaveApp.id;
      status = Codes.LEAVE_CANCELLED;
    }

    //Update leave application status
    await leaveAppModel.update(
      { status: status, addressee: null },
      {
        where: { id: req.params.leaveAppId },
        transaction
      }
    );

    /*******************************************************************************
     *** Inserting to leave ledger table ***
     *******************************************************************************/
    if (no_of_cl > 0) {
      // Casual Leave
      await leaveLedgerModel.create(
        {
          cal_year: curr_year,
          db_cr_flag: db_cr_flag,
          no_of_days: no_of_cl,
          leave_type: Codes.CL_CODE,
          emp_code: leaveApp.emp_code,
          remarks: remarks
        },
        { transaction }
      );
    }

    if (no_of_hd_cl > 0) {
      // Half day casual leave
      await leaveLedgerModel.create(
        {
          cal_year: curr_year,
          db_cr_flag: db_cr_flag,
          no_of_days: no_of_hd_cl,
          leave_type: Codes.CL_CODE,
          emp_code: leaveApp.emp_code,
          remarks: remarks
        },
        { transaction }
      );
    }

    if (no_of_rh > 0) {
      // Restrited holiday
      await leaveLedgerModel.create(
        {
          cal_year: curr_year,
          db_cr_flag: db_cr_flag,
          no_of_days: no_of_rh,
          leave_type: Codes.RH_CODE,
          emp_code: leaveApp.emp_code,
          remarks: remarks
        },
        { transaction }
      );
    }

    if (no_of_el > 0) {
      // Earned leave
      await leaveLedgerModel.create(
        {
          cal_year: curr_year,
          db_cr_flag: db_cr_flag,
          no_of_days: no_of_el,
          leave_type: Codes.EL_CODE,
          emp_code: leaveApp.emp_code,
          remarks: remarks
        },
        { transaction }
      );
    }

    if (no_of_hpl > 0) {
      // Half pay leave
      await leaveLedgerModel.create(
        {
          cal_year: curr_year,
          db_cr_flag: db_cr_flag,
          no_of_days: no_of_hpl,
          leave_type: Codes.HPL_CODE,
          emp_code: leaveApp.emp_code,
          remarks: remarks
        },
        { transaction }
      );
    }

    /*******************************************************************************
     *** Inserting to Absent Detail for Attendance Management System  ***
     *******************************************************************************/
    const absentDtl = [];
    const project_id = leaveApp.leaveApplier.project_id;

    cl_arr.forEach(element => {
      absentDtl.push({
        emp_code: leaveApp.emp_code,
        from_date: element.from_date,
        to_date: element.to_date,
        leave_code: Codes.CL_CODE,
        project_id: project_id,
        leave_application_id: leaveApp.id
      });
    });

    rh_arr.forEach(element => {
      absentDtl.push({
        emp_code: leaveApp.emp_code,
        from_date: element.from_date,
        to_date: element.to_date,
        leave_code: Codes.RH_CODE,
        project_id: project_id,
        leave_application_id: leaveApp.id
      });
    });

    hd_cl_arr.forEach(element => {
      absentDtl.push({
        emp_code: leaveApp.emp_code,
        from_date: element.from_date,
        to_date: element.to_date,
        leave_code: Codes.HD_CL_CODE,
        project_id: project_id,
        leave_application_id: leaveApp.id
      });
    });

    // Insert/Delete in to absent detail table
    if (db_cr_flag == "D") {
      await absentDetailModel.bulkCreate(absentDtl, { transaction });
    }

    if (db_cr_flag == "C") {
      await absentDetailModel.destroy({
        where: {
          leave_application_id: leaveApp.id
        },
        transaction
      });
    }

    /*******************************************************************************
     *** Commit transaction ***
     *******************************************************************************/
    await transaction.commit();

    res.status(200).json({ message: "Leave request processed successful" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Leave request processed unsuccessful" });

    await transaction.rollback();
  }
}

// Process callback action
async function processCallbackAction(req, res, status) {
  //Fetch current user
  const user = req.user;
  let transaction;

  try {
    const leaveApp = await leaveAppModel.find({
      where: { id: req.params.leaveAppId }
    });

    if (!leaveApp) {
      res.status(500).json({ message: "Leave application not found" });
      return;
    }

    transaction = await db.transaction({ autocommit: false });

    await leaveAppHistModel.create(
      {
        leave_application_id: req.params.leaveAppId,
        remarks: req.body.remarks,
        officer_emp_code: req.body.officer_emp_code,
        workflow_action: req.body.workflow_action
      },
      { transaction }
    );

    const addressee =
      user && user.emp_code == leaveApp.emp_code
        ? null
        : req.body.officer_emp_code;

    await leaveAppModel.update(
      {
        status: status,
        addressee: addressee
      },
      {
        where: { id: req.params.leaveAppId },
        transaction
      }
    );

    transaction.commit();
    res.status(200).json({ message: "Leave request processed successful" });
  } catch (error) {
    console.log(error);
    transaction.rollback();
    res.status(500).json({ message: "Leave request processed unsuccessful" });
  }
}

async function processLeaveWorkflowAction(req, res, status, addressee) {
  let transaction;

  try {
    const leaveApp = await leaveAppModel.find({
      where: { id: req.params.leaveAppId }
    });

    if (!leaveApp) {
      res.status(500).json({ message: "Leave application not found" });
      return;
    }

    transaction = await db.transaction({ autocommit: false });

    await leaveAppHistModel.create(
      {
        leave_application_id: req.params.leaveAppId,
        remarks: req.body.remarks,
        officer_emp_code: req.body.officer_emp_code,
        workflow_action: req.body.workflow_action
      },
      { transaction }
    );

    await leaveAppModel.update(
      {
        status: status,
        addressee: addressee
      },
      {
        where: { id: req.params.leaveAppId },
        transaction
      }
    );

    transaction.commit();
    res.status(200).json({ message: "Leave request processed successful" });
  } catch (error) {
    console.log(error);
    transaction.rollback();
    res.status(500).json({ message: "Leave request processed unsuccessful" });
  }
}

async function getQueryCondition(req, res) {
  const el_hpl_role = await checkRole.checkElHplRole(req);
  const leave_super_admin_role = await checkRole.checkLeaveSuperAdminRole(req);

  if (leave_super_admin_role) {
    return {
      addressee: {
        [Op.or]: [leave_super_admin_role.role, req.params.empCode]
      },
      project_id: {
        [Op.like]: "%"
      }
    };
  } else if (el_hpl_role) {
    return {
      addressee: {
        [Op.or]: [el_hpl_role.role, req.params.empCode]
      },
      project_id: {
        [Op.like]: "%" + el_hpl_role.project_id
      }
    };
  } else {
    return {
      addressee: req.params.empCode,
      project_id: {
        [Op.like]: "%"
      }
    };
  }
}

function filterData(req, res, results) {
  if (!results) return res.status(200).json(null);

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
          return Object.assign(
            {},
            {
              id: hist.id,
              officer: hist.officer,
              workflow_action: hist.workflow_action,
              updated_at: hist.updated_at,
              remarks: hist.remarks
            }
          );
        }),
        leaveDetails: result.leaveDetails.map(leaveDetail => {
          return Object.assign(
            {},
            {
              id: leaveDetail.id,
              leave_type: leaveDetail.leave_type,
              from_date: leaveDetail.from_date,
              to_date: leaveDetail.to_date,
              station_leave: leaveDetail.station_leave
            }
          );
        })
      }
    );
  });

  let data = {
    rows: leave_request,
    count: results.count
  };
  return res.status(200).json(data);
}

async function fetchLeaveApplication(req, res) {
  let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0;
  let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50;
  let offset = pageIndex * limit;

  let condition = await getQueryCondition(req, res);

  return leaveAppModel
    .findAndCountAll({
      order: [["created_at", "DESC"]],
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
          attributes: ["first_name", "last_name"],
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
              attributes: ["emp_code", "first_name", "last_name"]
            }
          ]
        },
        { model: joiningReportModel },
        { model: leaveDetailModel }
      ]
    })
    .then(results => {
      filterData(req, res, results);
    })
    .catch(err => {
      console.log(err);
      return res.status(500).json({ message: "Opps! Some error happened!!" });
    });
}

module.exports = router;
