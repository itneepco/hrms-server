const Sequelize = require('sequelize');
const db = require('../config/db');
const Employee = require('./employee.model')
const Hierarchy = db.define('hierarchy', {
    emp_code: {
      type: Sequelize.STRING,
      allowNull: false
    },
    parent_emp_code: {
      type: Sequelize.STRING
    }

}, {
    timestamps: false,
    underscored: true,
    tableName: 'hierarchy'
  }
);

Hierarchy.belongsTo(Employee, { as: "parent", foreignKey: 'parent_emp_code', targetKey: 'emp_code' })
Hierarchy.belongsTo(Employee, { foreignKey: 'emp_code', targetKey: 'emp_code' })
Hierarchy.hasMany(Hierarchy, { as: "children", foreignKey: 'parent_emp_code', sourceKey: 'emp_code' })
//Hierarchy.hasOne(Hierarchy,{ foreignKey: 'parent_emp_code'})
module.exports = Hierarchy