const Sequelize = require('sequelize');
const db = require('../../config/db');

const leaveCreditInfo = db.define('leave_credit_info', {
	cal_year: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
	},
	leave_type: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
	},
	created_by: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  remarks: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
	}
}, {
		underscored: true,
		tableName: 'leave_credit_info'
	}
)

module.exports = leaveCreditInfo