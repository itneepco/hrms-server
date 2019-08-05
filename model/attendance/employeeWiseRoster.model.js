const Sequelize = require("sequelize");
const db = require("../../config/db");

const empWiseRoster = db.define(
  "empWiseRoster",
  {
    emp_code: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    day: {
      type: Sequelize.DATEONLY,     
      allowNull: false
    },
    shift_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    in_time: {
      type: Sequelize.TIME
    },
    out_time: {
      type: Sequelize.TIME
    },
    attendance_status: {
      type: Sequelize.INTEGER
    },
    modified_status: {
      type: Sequelize.INTEGER
    },
    remarks: {
      type: Sequelize.STRING
    },
    created_by: {
      type: Sequelize.STRING,
      allowNull: false
    },
    updated_by: {
      type: Sequelize.STRING
    }
  },
  {
    underscored: true,
    tableName: "employee_wise_rosters"
  }
);

module.exports = empWiseRoster;
