const Sequelize = require('sequelize');
const db = require('../../config/db');

const trainingFeedback = db.define('training_feedbacks', {
	training_info_id: {
    type: Sequelize.INTEGER,
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
  ta_da_incurred:  {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true
    }
  },
  comments: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  duration_rating:  {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true
    },
    defaultValue: 0
  },
  content_rating:  {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true
    },
    defaultValue: 0
  },
  methodology_rating:  {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true
    },
    defaultValue: 0
  },
  admin_service_rating:  {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true
    },
    defaultValue: 0
  },
  overall_utility_rating:  {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true
    },
    defaultValue: 0
  },

}, {
		underscored: true,
		tableName: 'training_feedbacks'
	}
)

module.exports = trainingFeedback