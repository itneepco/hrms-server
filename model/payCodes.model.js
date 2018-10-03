const Sequelize = require('sequelize');
const db = require('../config/db');

const payCode = db.define('pay_code', {
   pay_code: {
        type: Sequelize.INTEGER
    },
    pay_code_desc: {
      type: Sequelize.STRING
    }
   
        
}, {
       
    underscored: true,
    timestamps:false,
    tableName:'ii_pay_codes'
    }
);

payCode.removeAttribute('id')

module.exports = payCode