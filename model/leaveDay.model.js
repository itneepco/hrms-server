
const Sequelize = require('sequelize');
const db = require('../config/db');

const LeaveTypeModel = require('../model/leaveType.model');

const leaveDay = db.define('leaveDay', {
    leave_application_id: {
        type: Sequelize.INTEGER
    },
    leave_type_id: {
        type: Sequelize.INTEGER
    },
    from_date:{
        type:Sequelize.DATEONLY
    },
    to_date:{
        type:Sequelize.DATEONLY
    }, 

}, {
       
    underscored: true,
    tableName:'leave_days'
    }
)

leaveDay.belongsTo(LeaveTypeModel)

module.exports = leaveDay