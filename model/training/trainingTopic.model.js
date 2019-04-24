const Sequelize = require('sequelize');
const db = require('../../config/db');
const topicRatingModel = require('./trainingTopicRating.model');

const trainingTopic = db.define('training_topic', {
	topic_name: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  faculty_name: {
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
  }
}, {
    timestamps: false,
		underscored: true,
		tableName: 'training_topics'
	}
)

trainingTopic.hasMany(topicRatingModel)
module.exports = trainingTopic