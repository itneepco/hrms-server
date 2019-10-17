const empWiseRosterModel = require("../../../../model/attendance/employeeWiseRoster.model");
const wageMonthModel = require("../../../../model/attendance/wageMonth.model");
const holidayModel = require("../../../../model/shared/holiday.model");
const absentDetailModel = require("../../../../model/attendance/absentDetail.model");
const genWorkDayModel = require("../../../../model/attendance/generalWorkingDay.model");
const shiftModel = require("../../../../model/attendance/shift.model");
const departmentModel = require('../../../../model/shared/department.model');
const designationModel = require('../../../../model/shared/designation.model');
const employeeModel = require('../../../../model/shared/employee.model');
const empGroupModel = require('../../../../model/attendance/employeeGroup.model');
const groupModel = require('../../../../model/attendance/group.model');
const dateTimeHelper = require("./dateTimeHelper");
const codes = require("../../../../global/codes");
const Op = require("sequelize").Op;


async function calculateAbsenteeStatement(projectId, from_date = null, to_date = null) {
  return new Promise(async (resolve, reject) => {
    try {
      let fromDate, toDate, actualFromDate;

      // Fetch the current wage month
      const currWageMonth = await wageMonthModel.findOne({
        where: {
          project_id: projectId,
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

      if (from_date !== null && to_date !== null) {
        actualFromDate = from_date;
        toDate = to_date;
      }
      else {
        actualFromDate = currWageMonth.from_date;
        toDate = currWageMonth.to_date;
      }

      fromDate = dateTimeHelper.decreaseDay(actualFromDate, 5)

      // Get list of general working days
      const genWorkDays = await genWorkDayModel.findAll({
        where: {
          day: { [Op.between]: [fromDate, toDate] },
          project_id: projectId
        }
      });

      // Get list of employees who are not exempted from punching
      const employeeGroups = await empGroupModel.findAll({
        include: [{
          model: groupModel,
          as: 'group',
          where: { project_id: projectId }
        }]
      })

      // Fetch data from employee_wise_roster between start date and end date of the current wage month
      const empWiseRosters = await empWiseRosterModel.findAll({
        where: {
          day: {
            [Op.between]: [fromDate, toDate]
          },
          project_id: projectId
        },
        order: [['emp_code', 'ASC'], ['day', 'ASC']],
        include: [
          {
            model: employeeModel,
            as: 'employee',
            attributes: ["first_name", "middle_name", "last_name"],
            include: [
              { model: departmentModel },
              { model: designationModel },
            ]
          },
          { model: shiftModel }
        ]
      });

      // Fetch holiday details for the current wage  month
      const holidays = await holidayModel.findAll({
        where: {
          day: { [Op.between]: [fromDate, toDate] },
          project_id: projectId,
          type: { [Op.eq]: "CH" }
        }
      });

      // Fetch absent details
      const absentDetails = await absentDetailModel.findAll({
        where: {
          [Op.or]: [
            { from_date: { [Op.between]: [fromDate, toDate] } },
            { to_date: { [Op.between]: [fromDate, toDate] } }
          ],
          project_id: projectId
        }
      });

      let records = {};
      let records_array = [];

      empWiseRosters.forEach(empRoster => {
        if (records[empRoster.emp_code] === undefined) {
          let employee = empRoster.employee

          records[empRoster.emp_code] = {
            emp_code: empRoster.emp_code,
            name: `${employee.first_name} ${employee.middle_name} ${employee.last_name}`,
            department_id: employee.department.id,
            department: `${employee.department.name}`,
            designation: `${employee.designation.name}`,
            present_days: [],
            absent_days: [],
            leave_days: [],
            half_days: [],
            late_days: [],
            off_days: [],
            buffer_days: [],
            absent_days_count: 0,
            project_id: projectId,
            prev_day_absent: false // For checking if on the previous day the employee was absent
          };
        }

        // Assign attendance status to the variable
        let attendance_status = empRoster.attendance_status;
        let date_diff = dateTimeHelper.compareDate(empRoster.day, actualFromDate)

        //---------------------------------------------------------------------------

        // Check if employee has been moved to exempted list after roster generation
        isExempted = !employeeGroups.find(empGroup => empGroup.emp_code === empRoster.emp_code)
        if (isExempted) return; // Skip if exempted

        //---------------------------------------------------------------------------

        // If modified status is 1 | Conclusion present
        if (empRoster.modified_status === 1) {
          if (date_diff >= 0) {
            records[empRoster.emp_code].present_days.push(empRoster.day);
          }
          // If employee has applied for leave, set prev_day_absent flag to FALSE
          records[empRoster.emp_code].prev_day_absent = false
          return;
        }

        //---------------------------------------------------------------------------

        // Check for applied leaves, tour etc
        const absentDtl = absentDetails.find(absentDetail => {
          return (
            absentDetail.emp_code === empRoster.emp_code &&
            dateTimeHelper.compareDate(empRoster.day, absentDetail.from_date) >=
            0 &&
            dateTimeHelper.compareDate(empRoster.day, absentDetail.to_date) <= 0
          );
        });

        // Employee has applied leave, tour etc
        if (absentDtl) {
          if (date_diff >= 0) {
            records[empRoster.emp_code].leave_days.push(empRoster.day);
          }
          // If employee has applied for leave, set prev_day_absent flag to FALSE
          records[empRoster.emp_code].prev_day_absent = false
          return;
        }

        //---------------------------------------------------------------------------

        // General Duty Employee is absent on a holiday | Conclusion holiday
        if (
          holidays.find(holiday => holiday.day === empRoster.day) &&
          empRoster.shift.is_general
        ) {
          if (date_diff >= 0) {
            // If employee is absent on previous day, add to buffer_days array
            if (records[empRoster.emp_code].prev_day_absent) {
              records[empRoster.emp_code].buffer_days.push(empRoster.day);
            }
            else {
              records[empRoster.emp_code].off_days.push(empRoster.day);
            }
          }
          return;
        }

        //---------------------------------------------------------------------------

        // If current day is either Saturday or Sunday and is general roster
        if (dateTimeHelper.isSundaySaturday(empRoster.day) &&
          empRoster.shift.is_general) {

          isWorkingDay = !genWorkDays.find(work_day => work_day.day === empRoster.day)
          if (isWorkingDay) {
            if (date_diff >= 0) {
              // If employee is absent on previous day, add to buffer_days array
              if (records[empRoster.emp_code].prev_day_absent) {
                return records[empRoster.emp_code].buffer_days.push(empRoster.day);
              }
              else {
                return records[empRoster.emp_code].off_days.push(empRoster.day);
              }
            }
          }
        }

        //---------------------------------------------------------------------------

        // For shift duty employees
        if (attendance_status === codes.ATTENDANCE_OFF_DAY) {
          if (date_diff >= 0) {
            // If employee is absent on previous day, add to buffer_days array
            if (records[empRoster.emp_code].prev_day_absent) {
              records[empRoster.emp_code].buffer_days.push(empRoster.day);
            }
            else {
              records[empRoster.emp_code].off_days.push(empRoster.day);
            }
          }
          return;
        }

        //---------------------------------------------------------------------------

        let buffer_days = records[empRoster.emp_code].buffer_days
        let prev_day_absent = records[empRoster.emp_code].prev_day_absent

        //---------------------------------------------------------------------------
        // ABSENT CASE CONDITION
        //---------------------------------------------------------------------------

        if (attendance_status === codes.ATTENDANCE_ABSENT) {
          // Mark 'prev_day_absent' to be used in the next iteration
          records[empRoster.emp_code].prev_day_absent = true

          if (date_diff >= 0) {
            // If previous_day_absent flag is true and buffer array is not empty
            if (prev_day_absent && buffer_days.length > 0) {

              records[empRoster.emp_code].absent_days = records[empRoster.emp_code].absent_days.concat(buffer_days)
              records[empRoster.emp_code].absent_days_count += buffer_days.length;

              buffer_days = records[empRoster.emp_code].buffer_days = []
            }

            records[empRoster.emp_code].absent_days.push(empRoster.day);
            records[empRoster.emp_code].absent_days_count += 1;
          }

          return;
        }

        //---------------------------------------------------------------------------
        // ALL TYPES OF PRESENT CASE CONDITION
        //---------------------------------------------------------------------------

        else {
          // Mark 'prev_day_absent' to be used in the next iteration
          records[empRoster.emp_code].prev_day_absent = false

          if (date_diff >= 0) {
            // If previous_day_absent flag is true and buffer array is not empty
            if (prev_day_absent && buffer_days.length > 0) {
              records[empRoster.emp_code].off_days = records[empRoster.emp_code].off_days.concat(buffer_days)
              buffer_days = records[empRoster.emp_code].buffer_days = []
            }

            if (attendance_status === codes.ATTENDANCE_LATE) {
              records[empRoster.emp_code].late_days.push(empRoster.day);
              return;
            }

            if (attendance_status === codes.ATTENDANCE_PRESENT) {
              records[empRoster.emp_code].present_days.push(empRoster.day);
              return;
            }

            if (attendance_status === codes.ATTENDANCE_HALF_DAY) {
              records[empRoster.emp_code].half_days.push(empRoster.day);
              records[empRoster.emp_code].absent_days_count += 0.5;
              return;
            }
          }
        }
      });

      //---------------------------------------------------------------------------
      // Convert to array from object based on employee code as key

      for (let key in records) {
        records_array.push(records[key]);
      }

      // console.log(records['004789'])

      resolve(records_array)

    } catch (error) {
      console.error("Error : " + error);
      reject(error)
    }
  })
}

module.exports = calculateAbsenteeStatement;
