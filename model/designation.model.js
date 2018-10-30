
const Sequelize = require('sequelize');
const db = require('../config/db');

const Designation = db.define('designation', {
  name: {
    type: Sequelize.STRING
  }
}, {
    underscored: true,
    tableName: 'designations'
  }
);

module.exports = Designation