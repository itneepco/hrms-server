
const Sequelize = require('sequelize');
const db = require('../config/db');

const Holiday = db.define('holiday', {
	name: {
		type: Sequelize.STRING
	},
	day: {
		type: Sequelize.DATEONLY
	},
	type: {
		type: Sequelize.STRING
	},
	project_id: {
		type: Sequelize.INTEGER
	},

}, {
		timestamps: false,
		underscored: true,
		tableName: 'holiday'
	}
);

module.exports = Holiday