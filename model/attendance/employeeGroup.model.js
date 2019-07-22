const Sequelize = require('sequelize')
const db = require('../../config/db')
const group = require('./group.model')
const employee = require('../shared/employee.model')


const employeeGroup = db.define('employeeGroup',{
    emp_code:{
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  group_id:{
    type: Sequelize.INTEGER,
    allowNull: false,
    
  }
  
},
  {
    underscored: true,
    tableName: "employee_group"
  }
)

employeeGroup.belongsTo(group,{as:'group',foreignKey:'group_id'})
employeeGroup.belongsTo(employee,{as:'employee',foreignKey:'emp_code',targetKey:'emp_code'})
module.exports = employeeGroup
