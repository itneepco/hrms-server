
const Sequelize = require('sequelize');
const db = require('../config/db');

const Designation = db.define('grades', {
	name: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
	}
}, {
		underscored: true,
		tableName: 'grades'
	}
);

module.exports = Designation