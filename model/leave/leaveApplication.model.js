
const Sequelize = require('sequelize');
const db = require('../../config/db');

const leaveAppHistModel = require('./leaveApplicationHist.model');
const leaveDetailModel = require('./leaveDetail.model');
const employeeModel = require('../shared/employee.model');
const joiningReportModel = require('./joiningReport.model');

const leaveApplication = db.define('leaveApplication', {
	emp_code: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
	},
	purpose: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
	},
	address: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
	},
	contact_no: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
	},
	addressee: {
		type: Sequelize.STRING
	},
	status: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
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
	remarks: {
		type: Sequelize.STRING
  },
  time_office_status: {
    type: Sequelize.BOOLEAN
  }
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