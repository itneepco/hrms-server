
const Sequelize = require('sequelize');
const db = require('../config/db');

const leaveAppHistModel = require('../model/leaveApplicationHist.model');
const leaveDetailModel = require('../model/leaveDetail.model');
const employeeModel = require('../model/employee.model');
const joiningReportModel = require('./joiningReport.model');

const leaveApplication = db.define('leaveApplication', {
	emp_code: {
		type: Sequelize.STRING
	},
	purpose: {
		type: Sequelize.STRING
	},
	address: {
		type: Sequelize.STRING
	},
	contact_no: {
		type: Sequelize.STRING
	},
	addressee: {
		type: Sequelize.STRING
	},
	status: {
		type: Sequelize.STRING
	},
  prefix_from: {
		type: Sequelize.DATEONLY
  },
  prefix_to: {
		type: Sequelize.DATEONLY
  },
  suffix_from: {
		type: Sequelize.DATEONLY
  },
  suffix_to: {
		type: Sequelize.DATEONLY
  },
}, 
{
	underscored: true,
	tableName: 'leave_application'
})

leaveApplication.hasMany(leaveAppHistModel)
leaveApplication.hasMany(leaveDetailModel)
leaveApplication.hasOne(joiningReportModel)

leaveApplication.belongsTo(employeeModel, { as: "leaveApplier", foreignKey: 'emp_code', targetKey: 'emp_code' })
leaveApplication.hasMany(leaveAppHistModel, { as: "leaveProcessor", foreignKey: 'leave_application_id', targetKey: 'id'})

module.exports = leaveApplication