const Sequelize = require("sequelize");
const db = require("../../config/db");

const leaveTypeModel = require("../shared/leaveType.model");

const absentDetail = db.define(
  "absentDetail",
  {
    emp_code: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    from_date: {
      type: Sequelize.DATEONLY,
      unique: true,
      allowNull: false
    },
    to_date: {
      type: Sequelize.DATEONLY,
      unique: true,
      allowNull: false
    },
    leave_code: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    project_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    leave_application_id: {
      type: Sequelize.INTEGER,
      allowNull: true
    }
  },
  {
    underscored: true,
    tableName: "absent_dtl"
  }
);

absentDetail.belongsTo(leaveTypeModel, {
  as: "leaveType",
  foreignKey: "leave_code",
  targetKey: "code"
});

module.exports = absentDetail;
