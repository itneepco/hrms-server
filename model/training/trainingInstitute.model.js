const Sequelize = require('sequelize');
const db = require('../../config/db');

const trainingInstitute = db.define('training_institute', {
	name: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  address: {
    type: Sequelize.STRING,
  },
  city: {
    type: Sequelize.STRING,
  },
  state: {
    type: Sequelize.STRING,
  },
  country: {
    type: Sequelize.STRING,
  },
  pin: {
    type: Sequelize.STRING,
  },
  website: {
    type: Sequelize.STRING,
  },
  contact_person: {
    type: Sequelize.STRING,
	},
  contact_no: {
    type: Sequelize.STRING,
  },
  contact_no2: {
    type: Sequelize.STRING,
  },
}, {
		underscored: true,
		tableName: 'training_institutes'
	}
)

module.exports = trainingInstitute