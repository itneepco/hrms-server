const Sequelize = require("sequelize");
const db = require("../../config/db");
const employeeModel = require('../shared/employee.model')

const punchingRec = db.define(
  "punchingRec",
  {
    punching_date: {
      type: Sequelize.DATEONLY,
      allowNull: false
    },
    project_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    emp_code: {
      type: Sequelize.STRING,
      allowNull: false
    },
    punching_time: {
      type: Sequelize.TIME,
      allowNull: false
    },
    machine_no: {
      type: Sequelize.STRING,
      allowNull: false
    },
    created_by: {
      type: Sequelize.STRING,
      allowNull: false
    }
  },
  {
    underscored: true,
    tableName: "punching_rec"
  }
);

module.exports = punchingRec;
