const Sequelize = require("sequelize");
const db = require("../../config/db");
const employee = require('../shared/employee.model')
const attendanceApplicationHistory = db.define(
  "attendanceApplicationHistory",
  {
    application_id:{
      type: Sequelize.INTEGER
    },
    
    officer_emp_code: {
      type: Sequelize.CHAR(6),
      allowNull: false
    },
    workflow_action:{
      type: Sequelize.CHAR(2),
      allowNull: false
    },
    remarks: {
      type: Sequelize.STRING
    }  
  },
  {
    underscored: true,
    tableName: "attendance_application_hist"
  }
);

attendanceApplicationHistory.belongsTo(employee, { as: "officer", foreignKey: 'officer_emp_code', targetKey: 'emp_code' })

module.exports = attendanceApplicationHistory;
