const Sequelize = require('sequelize');
const db = require('../../config/db');

const trainingNeedsInfo = db.define('training_needs_info', {
	year: {
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
  status: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  status: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  cadre: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
	}
}, {
		underscored: true,
		tableName: 'training_needs_infos'
	}
)

module.exports = trainingNeedsInfo