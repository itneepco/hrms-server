const Sequelize = require("sequelize");
const db = require("../../config/db");
const projectModel = require('../shared/project.model');

const GeneralWorkingDay = db.define(
  "GeneralWorkingDay",
  {
    day: {
      type: Sequelize.DATEONLY,
      allowNull: false
    },
    project_id: {
      type: Sequelize.INTEGER
    }
  },
  {
    underscored: true,
    tableName: "gen_work_day",
    timestamps:false
  }
);

GeneralWorkingDay.belongsTo(projectModel);
module.exports = GeneralWorkingDay;

