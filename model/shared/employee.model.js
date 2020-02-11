const Sequelize = require('sequelize');
const db = require('../../config/db');
const projectModel = require('./project.model');
const designationModel = require('./designation.model');
const departmentModel = require('./department.model');
const gradeModel = require('./grade.model')

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
  email: {
    type: Sequelize.STRING
  },
  designation_id: {
    type: Sequelize.INTEGER
  },
  department_id: {
    type: Sequelize.INTEGER
  },
  project_id: {
    type: Sequelize.INTEGER
  },
  grade_id: {
    type: Sequelize.INTEGER
  },
  dos: {
    type: Sequelize.DATEONLY
  },
  pwd: {
    type: Sequelize.BOOLEAN
  }
}, {
  underscored: true,
  tableName: 'personal_infos'
}
)

Employee.belongsTo(projectModel);
Employee.belongsTo(departmentModel);
Employee.belongsTo(designationModel);
Employee.belongsTo(gradeModel);

module.exports = Employee