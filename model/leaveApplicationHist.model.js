
const Sequelize = require('sequelize');
const db = require('../config/db');

const employeeModel = require('./employee.model');
const workflowActionModel = require('../model/workflowAction.model');
const leaveApplication = require('../model/leaveApplication.model');

const leaveApplicationHist = db.define('leaveApplicationHist', {
    leave_application_id: {
        type: Sequelize.INTEGER
    },
    officer_emp_code: {
        type: Sequelize.STRING
    },
    workflow_action_id: {
        type: Sequelize.INTEGER
    },
    isCurrent: {
        type: Sequelize.BOOLEAN
    }
}, {
        underscored: true,
        tableName: 'leave_application_hist'
    }
)

leaveApplicationHist.belongsTo(employeeModel, { as: "officer", foreignKey: 'officer_emp_code', targetKey: 'emp_code' })
leaveApplicationHist.belongsTo(workflowActionModel)
// leaveApplicationHist.belongsTo(leaveApplication)

module.exports = leaveApplicationHist