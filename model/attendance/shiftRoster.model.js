const Sequelize = require("sequelize")
const db = require("../../config/db")
const group = require("./group.model")
const shift = require("./shift.model")

const shiftRoster = db.define(
  "shiftRoster",
  {
    day: {
      type: Sequelize.DATEONLY,
      allowNull: false
    },
    shift_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    group_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    created_by: {
      type: Sequelize.STRING,
      validate: {
        notEmpty: true
      }
    },
    updated_by: {
      type: Sequelize.STRING
    }
  },
  {
    underscored: true,
    tableName: "shift_rosters"
  }
)

shiftRoster.belongsTo(group, { as: "group", foreignKey: "group_id" })
shiftRoster.belongsTo(shift, { as: "shift", foreignKey: "shift_id" })

module.exports = shiftRoster
