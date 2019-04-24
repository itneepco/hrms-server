const Sequelize = require('sequelize');
const db = require('../../config/db');

const trainingLabel = db.define('training_label', {
	name: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
}, {
		underscored: true,
		tableName: 'training_labels'
	}
)

module.exports = trainingLabel