const Sequelize = require("sequelize");
const db = require("../../config/db");
const wageMonthModel = require('./wageMonth.model');

const monthEnd = db.define(
  "monthEnd",
  {
    project_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    wage_month_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    emp_code: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    absent_days: {
      type: Sequelize.STRING,
      allowNull: false
    },
    absent_days_number: {
      type: Sequelize.INTEGER,     
      allowNull: false
    },
    half_days: {
      type: Sequelize.STRING,
      allowNull: false
    },
    half_days_number: {
      type: Sequelize.INTEGER,     
      allowNull: false
    },
    late_days: {
      type: Sequelize.STRING,
      allowNull: false
    },
    late_days_number: {
      type: Sequelize.INTEGER,     
      allowNull: false
    },
  },
  {
    underscored: true,
    tableName: "month_end"
  }
);

monthEnd.belongsTo(wageMonthModel);

module.exports = monthEnd;