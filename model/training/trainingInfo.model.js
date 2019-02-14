const Sequelize = require('sequelize');
const db = require('../../config/db');

const trainingInfo = db.define('training_infos', {
	course_title: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  from_date: {
    type: Sequelize.DATEONLY,
    validate: {
      notEmpty: true
    }
  },
  to_date: {
    type: Sequelize.DATEONLY,
    validate: {
      notEmpty: true
    }
  },
  venue: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  objective: {
    type: Sequelize.STRING,
  },
  training_type: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  training_institute_id: {
    type: Sequelize.INTEGER,
  },
  status: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  training_order_name: {
    type: Sequelize.STRING,
  },
}, {
		underscored: true,
		tableName: 'training_infos'
	}
)

module.exports = trainingInfo