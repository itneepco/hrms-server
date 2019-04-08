
const Sequelize = require('sequelize');
const db = require('../config/db');

const leaveDetail = db.define('leaveDetail', {
	leave_application_id: {
    type: Sequelize.INTEGER,
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
	from_date: {
    type: Sequelize.DATEONLY,
    validate: {
      notEmpty: true
    }
	},
	to_date: {
		type: Sequelize.DATEONLY
	},
  station_leave: {
    type: Sequelize.BOOLEAN,
    validate: {
      notEmpty: true
    }
	},
}, 
{
	underscored: true,
	tableName: 'leave_detail'
})

module.exports = leaveDetail