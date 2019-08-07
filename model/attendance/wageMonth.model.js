const Sequelize = require("sequelize");
const db = require("../../config/db");

const wageMon = db.define(
  "wageMon",
  {
    project_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
   from_date: {
      type: Sequelize.DATEONLY,
      allowNull: false
    },
    to_date: {
      type: Sequelize.DATEONLY,
      allowNull: false
    },
    is_active: {
      type: Sequelize.BOOLEAN
    },
    shift_roster_status:{
      type: Sequelize.BOOLEAN
    },
    gen_roster_status:{
      type: Sequelize.BOOLEAN
    }
  },
  {
    underscored: true,
    tableName: "wage_month"
  }
);

module.exports = wageMon;
