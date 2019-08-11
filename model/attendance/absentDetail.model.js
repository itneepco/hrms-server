const Sequelize = require('sequelize');
const db = require('../../config/db');

const leaveTypes= require('../leave/leaveType.model');

const absentDetail = db.define('absentDetail',{
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


absentDetail.belongsTo(leaveTypes, { as: "leave_type", foreignKey: "leave_type_id" });

module.exports = absentDetail;