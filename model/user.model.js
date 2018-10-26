const Sequelize = require('sequelize');
const db = require('../config/db');

const User = db.define('user', {
	emp_code: {
		type: Sequelize.STRING
	},
	user_name: {
		type: Sequelize.STRING
	},
	password_digest: {
		type: Sequelize.STRING
	},
	role: {
		type: Sequelize.INTEGER
	},
	project_id: {
		type: Sequelize.INTEGER
	}
}, {
		underscored: true
	}
);

module.exports = User