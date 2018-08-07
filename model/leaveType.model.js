const Sequelize = require('sequelize');
const db = require('../config/db');

const LeaveType = db.define('leaveType', {
   ltype: {
        type: Sequelize.STRING
    }
           
}, {
       
    underscored: true,
    timestamps: false,
    tableName:'leave_type'
    }
);

module.exports = LeaveType