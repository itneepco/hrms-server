
const Sequelize = require('sequelize');
const db = require('../../config/db');

const leaveLedger = db.define('leaveLedger', {
	emp_code: {
		type: Sequelize.STRING
	},
	cal_year: {
		type: Sequelize.INTEGER
	},
	db_cr_flag: {
		type: Sequelize.CHAR
	},
	no_of_days: {
		type: Sequelize.FLOAT
	},
	leave_type: {
		type: Sequelize.STRING
	},
	remarks: {
		type: Sequelize.STRING
	},
	is_manually_added: {
		type: Sequelize.BOOLEAN // if added by HR admin from leave ledger screen manually
	}
}, {
		underscored: true,
		tableName: 'leave_ledger'
	}
)

module.exports = leaveLedger