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


async function calculateAbsenteeStatement(req) {
  return new Promise(async (resolve, error) => {
    try {
      // Fetch the current wage month
      const currWageMonth = await wageMonthModel.findOne({
        where: {
          project_id: req.params.projectId,
          status: codes.WAGE_MONTH_ACTIVE
        }
      });
  
      // If current wage month does not exist, return error
      if (!currWageMonth) {
        return res.status(200).json({
          message: "Wage month corresponding to day does not exist",
          error: false,
          data: null
        });
      }
  
      // Get list of general working days
      const genWorkDays = await genWorkDayModel.findAll({
        where: {
          day: { [Op.between]: [currWageMonth.from_date, currWageMonth.to_date] },
          project_id: req.params.projectId
        }
      });
  
      // To do: Check whether punching records for the employess have been processed for each day
      // in the current wage month
  
      // Fetch data from employee_wise_roster between start date and end date of the current wage month
      const empWiseRosters = await empWiseRosterModel.findAll({
        where: {
          day: {
            [Op.between]: [currWageMonth.from_date, currWageMonth.to_date]
          },
          project_id: req.params.projectId
        },
  
        include: [
          {
            model: employeeModel,
            as: 'employee',  
            attributes: ["first_name", "middle_name", "last_name"],
            include: [
              { model: projectModel },
              {
                model: departmentModel
              },
              { model: designationModel },
              { model: gradeModel }
            ]
          },
          { model: shiftModel }
        ]
      });
  
      // Fetch holiday details for the current wage  month
      const holidays = await holidayModel.findAll({
        where: {
          day: { [Op.between]: [currWageMonth.from_date, currWageMonth.to_date] },
          project_id: req.params.projectId,
          type: { [Op.eq]: "CH" }
        }
      });
  
      // Fetch absent details
      const absentDetails = await absentDetailModel.findAll({
        where: {
          [Op.or]: [
            {
              from_date: {
                [Op.between]: [currWageMonth.from_date, currWageMonth.to_date]
              }
            },
            {
              to_date: {
                [Op.between]: [currWageMonth.from_date, currWageMonth.to_date]
              }
            }
          ],
          project_id: req.params.projectId
        }
      });
  
      let records       = {};
      let records_array = [];
  
      empWiseRosters.forEach(empRoster => {
  
        if (records[empRoster.emp_code] === undefined) {
          records[empRoster.emp_code] = {
            emp_code         : empRoster.emp_code,
            name             : `${empRoster.employee.first_name} ${empRoster.employee.middle_name} ${empRoster.employee.last_name}`,
            department_id    : empRoster.employee.department.id,
            department       : `${empRoster.employee.department.name}`,
            designation      : `${empRoster.employee.designation.name}`,
            present_days     : [],
            absent_days      : [],
            holidays         : [],
            sunday_saturdays : [],
            leave_days       : [],
            half_days        : [],
            late_days        : [],
            off_days         : [],
            absent_days_count: 0
          };
        }
  
        let attendance_status = empRoster.attendance_status;
  
        /*
        records[empRoster.emp_code] = calculateAbsenteeStatement(
          attendance_status,
          records[empRoster.emp_code],
          empRoster,
          genWorkDays,
          holidays,
          absentDetails
        );
        */
  
        //*************************************************************************** */
        //*************************************************************************** */
        
        //---------------------------------------------------------------------------
        // If modified status is 1 | Conclusion present
        if (empRoster.modified_status === 1) {
          records[empRoster.emp_code].present_days.push(empRoster.day);
          return;
        }
        //---------------------------------------------------------------------------
  
        //---------------------------------------------------------------------------
        // Employee is absent on a holiday | Conclusion holiday
        if (
          holidays.find(holiday => holiday.day === empRoster.day) &&
          empRoster.shift.is_general
        ) {
          records[empRoster.emp_code].holidays.push(empRoster.day);
          
          return;
        }
        //---------------------------------------------------------------------------
  
        //---------------------------------------------------------------------------
        // Check for leave
        const absentDtl = absentDetails.find(absentDetail => {
          return (
            absentDetail.emp_code === empRoster.emp_code &&
            dateTimeHelper.compareDate(empRoster.day, absentDetail.from_date) >=
              0 &&
            dateTimeHelper.compareDate(empRoster.day, absentDetail.to_date) <= 0
          );
        });
  
        if (absentDtl) {
          // Employee has applied leave
          records[empRoster.emp_code].leave_days.push(empRoster.day);
          
          return;
        }
        //---------------------------------------------------------------------------
  
        //---------------------------------------------------------------------------
        // Sunday or Saturday and not declared as working day
        if (
          dateTimeHelper.isSundaySaturday(empRoster.day) &&
          empRoster.shift.is_general
        ) {
          if (!genWorkDays.find(work_day => work_day.day === empRoster.day)) {
            records[empRoster.emp_code].sunday_saturdays.push(empRoster.day);
            
            return;
          }
        }
        //---------------------------------------------------------------------------
  
        //---------------------------------------------------------------------------
        if (attendance_status === codes.ATTENDANCE_ABSENT) {
          records[empRoster.emp_code].absent_days.push(empRoster.day);
          records[empRoster.emp_code].absent_days_count += 1;
          
          return;
        }
        //---------------------------------------------------------------------------
  
        //---------------------------------------------------------------------------
        if (attendance_status === codes.ATTENDANCE_LATE) {
          records[empRoster.emp_code].late_days.push(empRoster.day);
          
          return;
        }
        //---------------------------------------------------------------------------
  
        //---------------------------------------------------------------------------
        if (attendance_status === codes.ATTENDANCE_PRESENT) {
          records[empRoster.emp_code].present_days.push(empRoster.day);
          
          return;
        }
        //---------------------------------------------------------------------------
  
        //---------------------------------------------------------------------------
        if (attendance_status === codes.ATTENDANCE_HALF_DAY) {
          records[empRoster.emp_code].half_days.push(empRoster.day);
          records[empRoster.emp_code].absent_days_count += 0.5;
          
          return;
        }
        //---------------------------------------------------------------------------
  
        //---------------------------------------------------------------------------
        if (attendance_status === codes.ATTENDANCE_OFF_DAY) {
          records[empRoster.emp_code].off_days.push(empRoster.day);
          records[empRoster.emp_code].absent_days_count += 0.5;
          
          return;
        }
        //---------------------------------------------------------------------------
        
        //*************************************************************************** */
        //*************************************************************************** */
      });
  
      for (let key in records) {
        if (key === records[key].emp_code) {
          records_array.push(records[key]);
        }
      }

      resolve(records_array)
  
    } catch (error) {
      console.error("Error : " + error);
      reject(error)
    } 
  })
}

module.exports = calculateAbsenteeStatement;
