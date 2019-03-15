const Sequelize = require('sequelize');
const db = require('../../config/db');

const topicRatingModel = db.define('training_topic_ratings', {
	emp_code: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  training_topic_id: {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true
    }
  },
  rating: {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true
    }
  }
}, {
    timestamps: false,
		underscored: true,
		tableName: 'training_topic_ratings'
	}
)

module.exports = topicRatingModel