const Sequelize = require('sequelize');
const db = require('../../config/db');

const trainingNeedsInfo = db.define('training_need_info_hist', {
  training_need_info_id: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  workflow_action: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  officer_emp_code: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
	}
}, {
		underscored: true,
		tableName: 'training_need_info_hist'
	}
)

module.exports = trainingNeedsInfo