const Sequelize = require('sequelize');
const db = require('../../config/db');

const attendanceApplicationHistory = require('./attendanceApplicationHistory.model')
const employee = require('../shared/employee.model')


const attendanceApplication = db.define(
  'attendanceApplication',
  {
    emp_code: {
      type: Sequelize.CHAR(6),
      allowNull: false
    },
    day:{
      type: Sequelize.DATEONLY,
      allowNull: false
    },   
    addresse:{
      type: Sequelize.CHAR(6),
      allowNull: false
    },
    reason: {
      type: Sequelize.STRING
    },
    isMutual:{
      type: Sequelize.BOOLEAN
    },
    mutual_emp_code: {
      type: Sequelize.CHAR(6)
    },
    status:{
      type: Sequelize.CHAR(2),
      allowNull: false
    }
  },
  {
    underscored: true,
    tableName: 'attendance_application'
  }
);

attendanceApplication.belongsTo(employee, { as: 'mutual_employee', foreignKey: 'mutual_emp_code', targetKey: 'emp_code' })
attendanceApplication.belongsTo(employee, { as: 'applier', foreignKey: 'emp_code', targetKey: 'emp_code' })
attendanceApplication.hasMany(attendanceApplicationHistory, { as: 'applicationHistory', foreignKey: 'application_id', targetKey: 'id'})
module.exports = attendanceApplication;
