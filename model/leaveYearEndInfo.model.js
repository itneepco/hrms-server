const Sequelize = require('sequelize');
const db = require('../config/db');

const leaveYearEndInfo = db.define('leave_year_end_info', {
	cal_year: {
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
		tableName: 'leave_year_end_info'
	}
)

module.exports = leaveYearEndInfo