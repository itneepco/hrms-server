const Sequelize = require('sequelize');
const db = require('../../config/db');
const employeeModel = require('../employee.model')

const trainingNeedsInfo = db.define('training_need_info', {
	year: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  emp_code: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  status: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  addressee: {
    type: Sequelize.STRING
  },
  cadre: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
	}
}, {
		underscored: true,
		tableName: 'training_need_infos'
	}
)

trainingNeedsInfo.belongsTo(employeeModel, { foreignKey: 'emp_code', targetKey: 'emp_code'})

module.exports = trainingNeedsInfo