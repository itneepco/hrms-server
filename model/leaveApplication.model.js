
const Sequelize = require('sequelize');
const db = require('../config/db');

const leaveAppHistModel = require('../model/leaveApplicationHist.model');
const leaveDayModel = require('../model/leaveDay.model');
const employeeModel = require('../model/employee.model');

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
leaveApplication.belongsTo(employeeModel, { as: "leaveApplier", foreignKey: 'emp_code', targetKey: 'emp_code' })

module.exports = leaveApplication