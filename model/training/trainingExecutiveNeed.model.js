const Sequelize = require('sequelize');
const db = require('../../config/db');

const executiveNeed = db.define('training_executive_needs', {
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

module.exports = executiveNeed