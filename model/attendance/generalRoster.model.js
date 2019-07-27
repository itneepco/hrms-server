const Sequelize = require("sequelize")
const db = require("../../config/db")
const group = require("./group.model")
const shift = require("./shift.model")

const generalRoster = db.define(
  "generalRoster",
  {   
    shift_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    group_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    }
  },
  {
    underscored: true,
    tableName: "general_roster",
    timestamps:false
  }
)

generalRoster.belongsTo(group, { as: "group", foreignKey: "group_id" })
generalRoster.belongsTo(shift, { as: "shift", foreignKey: "shift_id" })

module.exports = generalRoster
