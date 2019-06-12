const Sequelize = require('sequelize');
const db = require('../../config/db');
employeeModel = require('./employee.model')
projectModel = require('./project.model')

const roleMapper = db.define('role_mapper', {
	role: {
		type: Sequelize.STRING
	},
	emp_code: {
		type: Sequelize.STRING
	},
	project_id: {
		type: Sequelize.INTEGER
	}

}, {
		underscored: true,
		timestamps: false,
		tableName: 'role_mapper'
	}
);

roleMapper.belongsTo(employeeModel, { as: "admin", foreignKey: 'emp_code', targetKey: 'emp_code' })
roleMapper.belongsTo(projectModel)
module.exports = roleMapper