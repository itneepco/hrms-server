const Sequelize = require("sequelize")
const db = require("../../config/db")
const projectModel = require('../shared/project.model')
const Shift = db.define('shift',{
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  project_id: {
    type: Sequelize.INTEGER
  },
  in_time_start:{
    type: Sequelize.TIME    
  },
  in_time_end:{
    type: Sequelize.TIME    
  },
  out_time_start:{
    type: Sequelize.TIME
  },
  out_time_end:{
    type: Sequelize.TIME
  },
  late_time:{
    type: Sequelize.TIME
  },
  half_time:{
    type: Sequelize.TIME
  },
  created_by: {
    type: Sequelize.STRING,
    validate: {
      notEmpty: true
    }
  },
  updated_by: {
    type: Sequelize.STRING
  },
  is_night_shift: {
    type: Sequelize.TINYINT
  }
},
{
  underscored: true,
  tableName: "shifts"
}
)
Shift.belongsTo(projectModel)
Shift.belongsTo(employeeModel, { as: "creator", foreignKey: 'created_by', targetKey: 'emp_code' })
module.exports = Shift