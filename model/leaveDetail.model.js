
const Sequelize = require('sequelize');
const db = require('../config/db');

const leaveDetail = db.define('leaveDetail', {
	leave_application_id: {
		type: Sequelize.INTEGER
	},
	leave_type: {
		type: Sequelize.STRING
	},
	from_date: {
		type: Sequelize.DATEONLY
	},
	to_date: {
		type: Sequelize.DATEONLY
	},
  station_leave: {
		type: Sequelize.BOOLEAN
	},
}, 
{
	underscored: true,
	tableName: 'leave_detail'
})

module.exports = leaveDetail