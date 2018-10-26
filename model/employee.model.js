const Sequelize = require('sequelize');
const db = require('../config/db');
const projectModel = require('./project.model')
const designationModel = require('./designation.model')

const Employee = db.define('employee', {
	emp_code: {
		type: Sequelize.STRING
	},
	first_name: {
		type: Sequelize.STRING
	},
	middle_name: {
		type: Sequelize.STRING
	},
	last_name: {
		type: Sequelize.STRING
	},
	designation_id: {
		type: Sequelize.INTEGER
	},
	project_id: {
		type: Sequelize.INTEGER
	}
}, {
		underscored: true,
		tableName: 'personal_infos'
	}
)

Employee.belongsTo(projectModel)
Employee.belongsTo(designationModel)
module.exports = Employee