const Sequelize = require('sequelize');
const db = require('../config/db');

const Project = db.define('project', {
  name: {
    type: Sequelize.STRING
  },
  code: {
    type: Sequelize.STRING
  },
}, {
    underscored: true,
    tableName: 'projects'
  }
);

module.exports = Project