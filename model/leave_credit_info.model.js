const Sequelize = require('sequelize');
const db = require('../config/db');

const leaveCreditInfo = db.define('leave_credit_info', {
	cal_year: {
		type: Sequelize.STRING
	},
	leave_type: {
		type: Sequelize.STRING
	},
	created_by: {
		type: Sequelize.STRING
	}
}, {
		underscored: true,
		tableName: 'leave_credit_info'
	}
)

module.exports = leaveCreditInfo