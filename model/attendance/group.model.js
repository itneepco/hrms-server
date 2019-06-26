const Sequelize = require("sequelize");
const db = require("../../config/db");
const projectModel = require('../shared/project.model');

const Group = db.define(
  "group",
  {
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    project_id: {
      type: Sequelize.INTEGER
    },
    is_general: {
      type: Sequelize.TINYINT
    }
  },
  {
    underscored: true,
    tableName: "groups"
  }
);

Group.belongsTo(projectModel);
module.exports = Group;

