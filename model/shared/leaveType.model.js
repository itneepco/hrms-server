const Sequelize = require('sequelize');
const db = require('../../config/db');

const leaveTypes = db.define('leave_types', {
	code: {
		type: Sequelize.STRING
	},
	description: {
		type: Sequelize.STRING
	}
}, {
		underscored: true,	
		tableName: 'leave_types'
	}
);
module.exports = leaveTypes;