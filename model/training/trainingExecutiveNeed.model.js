const Sequelize = require('sequelize');
const db = require('../../config/db');
const labelModel = require('./trainingLabel.model')
const executiveNeed = db.define('training_executive_need', {
	need_type: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  duration: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  training_label_id: {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true
    }
  },
  topic: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  emp_code: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  year: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  hod_remarks: {
    type: Sequelize.STRING,
  },
}, {
		underscored: true,
		tableName: 'training_executive_needs'
	}
)

executiveNeed.belongsTo(labelModel)

module.exports = executiveNeed