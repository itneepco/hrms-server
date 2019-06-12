const Sequelize = require('sequelize');
const db = require('../../config/db');
const trainingTopic = require('./trainingTopic.model')
const trainingParticipant = require('./trainingParticipant.model')
const trainingFeedback = require('./trainingFeedback.model')

const trainingInfo = db.define('training_info', {
	course_title: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  training_institute_id: {
    type: Sequelize.INTEGER,
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
  status: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  training_order_name: {
    type: Sequelize.STRING,
  },
  project_id: {
    type: Sequelize.INTEGER,
    validate: {
      notEmpty: true
    }
  }
}, {
		underscored: true,
		tableName: 'training_infos'
	}
)

trainingInfo.hasMany(trainingFeedback)
trainingFeedback.belongsTo(trainingInfo)
trainingInfo.hasMany(trainingParticipant)
trainingInfo.hasMany(trainingTopic)
trainingInfo.hasMany(trainingParticipant, { as: "employee", foreignKey: 'training_info_id', targetKey: 'id'})


module.exports = trainingInfo