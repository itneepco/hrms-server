const Sequelize = require('sequelize');
const db = require('../../config/db');

const trainingTopic = db.define('training_topics', {
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

module.exports = trainingTopic