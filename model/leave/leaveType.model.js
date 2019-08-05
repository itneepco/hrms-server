const Sequelize = require('sequelize');
const db = require('../../config/db');

const leaveType = db.define('absentDtl',{
  code: {
    type: Sequelize.INTEGER,
    unique: true,
    allowNull: false
  },
  description: {
    type: Sequelize.STRING,   
    allowNull: false
  }
},
{
  underscored: true,
  tableName: "leave_types"
}

);

module.exports = leaveType;