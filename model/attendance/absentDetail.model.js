const Sequelize = require('sequelize');
const db = require('../../config/db');

const absentDtl = db.define('absentDtl',{
  emp_code: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  from_date: {
    type: Sequelize.DATEONLY,
    unique: true,
    allowNull: false
  },
  to_date: {
    type: Sequelize.DATEONLY,
    unique: true,
    allowNull: false
  },
  leave_type_id:{
    type: Sequelize.INTEGER,
    allowNull: false
  }
},
{
  underscored: true,
  tableName: "absent_dtl"
}

);

module.exports = absentDtl;