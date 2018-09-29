const Sequelize = require('sequelize');
const db = require('../config/mysqldb');

const PayImage = db.define('pay_image', {
   emp_num: {
        type: Sequelize.STRING
    },
    yymm:{
       type: Sequelize.INTEGER
    },
    pay_code:{
      type:Sequelize.INTEGER
    },
    pay_code_srl:{
      type:Sequelize.INTEGER
    },
    pay_mode:{
      type:Sequelize.INTEGER
    },
    txn_amt:{
      type:Sequelize.DOUBLE
    } 
   
        
}, {
       
    underscored: true,
    tableName:'ii_pay_image'
    }
);

module.exports = PayImage