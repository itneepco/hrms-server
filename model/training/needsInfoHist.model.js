const Sequelize = require('sequelize');
const db = require('../../config/db');
const employeeModel = require('../employee.model')

const trainingNeedsInfo = db.define('training_need_info_hist', {
  training_need_info_id: {
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
  officer_emp_code: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  remarks: {
    type: Sequelize.STRING,
  }
}, {
		underscored: true,
		tableName: 'training_need_info_hist'
	}
)

trainingNeedsInfo.belongsTo(employeeModel, { as: "officer", foreignKey: 'officer_emp_code', targetKey: 'emp_code' })

module.exports = trainingNeedsInfo