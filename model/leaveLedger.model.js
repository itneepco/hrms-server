
const Sequelize = require('sequelize');
const db = require('../config/db');

const leaveLedger = db.define('leaveLedger', {
    emp_code: {
        type: Sequelize.STRING
    },
    cal_year: {
        type: Sequelize.INTEGER
    },
    db_cr_flag:{
        type:Sequelize.CHAR
    },
    no_of_days:{
        type: Sequelize.INTEGER
    },
    leave_type:{
        type:Sequelize.STRING
    },
    remarks:{
        type:Sequelize.STRING
    }
        
}, {
       
    underscored: true,
    tableName:'leave_ledger'
    }
)

module.exports = leaveLedger