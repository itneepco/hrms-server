
const Sequelize = require('sequelize');
const db = require('../config/db');

const leaveDay = db.define('leaveDay', {
    leave_application_id: {
        type: Sequelize.INTEGER
    },
    leave_type: {
        type: Sequelize.STRING
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

module.exports = leaveDay