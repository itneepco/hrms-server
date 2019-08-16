
const Sequelize = require('sequelize');
const db = require('../../config/db');

const Department = db.define('department', {
	name: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
	}
}, {
		underscored: true,
		tableName: 'departments'
	}
);

module.exports = Department;