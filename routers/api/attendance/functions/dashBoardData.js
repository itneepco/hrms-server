const empWiseRosterModel = require("../../../../model/attendance/employeeWiseRoster.model");
const wageMonthModel = require("../../../../model/attendance/wageMonth.model");
const holidayModel = require("../../../../model/shared/holiday.model");
const absentDetailModel = require("../../../../model/attendance/absentDetail.model");
const genWorkDayModel = require("../../../../model/attendance/generalWorkingDay.model");
const shiftModel = require("../../../../model/attendance/shift.model");
const projectModel = require('../../../../model/shared/project.model');
const departmentModel = require('../../../../model/shared/department.model');
const designationModel = require('../../../../model/shared/designation.model');
const gradeModel = require('../../../../model/shared/grade.model');
const dateTimeHelper = require("./dateTimeHelper");
const codes = require("../../../../global/codes");
const Op = require("sequelize").Op;

async function getProjects(projectId) {
  return new Promise(async (resolve, reject) => {
    try {
      const projects = await projectModel.findAll({
        attributes: ['id', 'name', 'code'],
        include: [
          {
            model: shiftModel,
            as: 'shift',
            attributes: [
              'id',
              'name',
              'in_time_start',
              'in_time_end',
              'out_time_start',
              'out_time_end',
              'late_time',
              'working_hours',
              'is_night_shift',
              'is_general'
            ]
          }
        ]
      });
      resolve(projects);
    } catch (error) {
      console.error("Error : " + error);
      reject(error)
    }
  });
}

async function getShiftTimings(projects) {
  return new Promise(async (resolve, reject) => {
    try {
    } catch (error) {
      console.error("Error : " + error);
      reject(error)
    }
  });
}

module.exports = {
  getProjects,
  getShiftTimings
};