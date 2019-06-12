const Sequelize = require('sequelize');
const db = require('../../config/db');
const payCodes = require('./payCodes.model')
const payImage = db.define('pay_image', {
  emp_num: {
    type: Sequelize.STRING
  },
  yymm: {
    type: Sequelize.INTEGER
  },
  pay_code: {
    type: Sequelize.INTEGER
  },
  pay_code_srl: {
    type: Sequelize.INTEGER
  },
  pay_mode: {
    type: Sequelize.INTEGER
  },
  txn_amt: {
    type: Sequelize.DOUBLE
  }
  
}, {
    underscored: true,
    timestamps: false,
    tableName: 'ii_pay_image'
  }
);
payImage.removeAttribute('id')
payImage.belongsTo(payCodes, { as: 'payCode', foreignKey: 'pay_code', targetKey: 'pay_code' })

module.exports = payImage