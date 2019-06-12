
const Sequelize = require('sequelize');
const db = require('../../config/db');

const employeeModel = require('../shared/employee.model');

const leaveApplicationHist = db.define('leaveApplicationHist', {
	leave_application_id: {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true
    }
	},
	officer_emp_code: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
	},
	workflow_action: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
	},
	remarks: {
		type: Sequelize.STRING
	}
},
{
	underscored: true,
	tableName: 'leave_application_hist'
})

leaveApplicationHist.belongsTo(employeeModel, { as: "officer", foreignKey: 'officer_emp_code', targetKey: 'emp_code' })

module.exports = leaveApplicationHist