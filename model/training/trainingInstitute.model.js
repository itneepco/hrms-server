const Sequelize = require('sequelize');
const db = require('../../config/db');

const trainingInstitute = db.define('training_institutes', {
	name: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
	},
}, {
		underscored: true,
		tableName: 'training_institutes'
	}
)

module.exports = trainingInstitute