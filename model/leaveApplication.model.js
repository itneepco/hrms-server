
const Sequelize = require('sequelize');
const db = require('../config/db');

const leaveAppHistModel = require('../model/leaveApplicationHist.model');
const leaveDayModel = require('../model/leaveDay.model');

const leaveApplication = db.define('leaveApplication', {
    emp_code: {
        type: Sequelize.STRING
    },
    purpose:{
        type:Sequelize.STRING
    },
    address:{
        type: Sequelize.STRING
    },
    contact_no:{
        type:Sequelize.STRING
    }, 
}, {
       
    underscored: true,
    tableName:'leave_application'
    }
)

leaveApplication.hasMany(leaveAppHistModel)
leaveApplication.hasMany(leaveDayModel)

module.exports = leaveApplication