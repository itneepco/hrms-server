const Sequelize = require('sequelize');
const db = require('../../config/db');

const projectModel = require('../project.model')
const designationModel = require('../designation.model')
const gradeModel = require('../grade.model')
const employeeModel = require('../employee.model')

const participantModel = db.define('training_participant', {
	emp_code: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  training_info_id: {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true
    }
  },
  designation_id: {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true
    }
  },
  grade_id: {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true
    }
  },
  project_id: {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true
    }
  },
  present: {
    type: Sequelize.BOOLEAN,
    validate: {
      notEmpty: true
    },
    defaultValue: false
  },
  
}, {
    timestamps: false,
		underscored: true,
		tableName: 'training_participants'
	}
)

participantModel.belongsTo(projectModel)
participantModel.belongsTo(designationModel)
participantModel.belongsTo(gradeModel)
participantModel.belongsTo(employeeModel, { foreignKey: 'emp_code', targetKey: 'emp_code'})

module.exports = participantModel