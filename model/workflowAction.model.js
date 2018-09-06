const Sequelize = require('sequelize');
const db = require('../config/db');

const workflowAction = db.define('workflowAction', {
    action_name: {
      type: Sequelize.STRING
    }      
  }, 
  {   
    underscored: true,
    timestamps: false,
    tableName:'workflow_action'
  }
);

module.exports = workflowAction