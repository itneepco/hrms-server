
const Sequelize = require('sequelize');
const db = require('../config/db');

const joiningReport = db.define('joiningReport', {
  leave_application_id: {
		type: Sequelize.INTEGER
	},
	joining_date: {
		type: Sequelize.DATEONLY
	},
	session: {
		type: Sequelize.STRING
	},
  status: {
		type: Sequelize.STRING
  },
  comment: {
		type: Sequelize.TEXT
  },
  addressee: {
		type: Sequelize.STRING
	},
}, 
{
  underscored: true,
  timestamps: false,
	tableName: 'joining_report'
})

module.exports = joiningReport