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
      let fromDate, toDate, actualFromDate, actualToDate;

      // Fetch the current wage month
      const currWageMonth = await wageMonthModel.findOne({
        where: {
          project_id: projectId,
          status: codes.WAGE_MONTH_ACTIVE
        }
      });

      //---------------------------------------------------------------------------

      // If current wage month does not exist, return error
      if (!currWageMonth) {
        return res.status(200).json({
          message: "Wage month corresponding to day does not exist",
          error: false,
          data: null
        });
      }

      //---------------------------------------------------------------------------
      if (from_date !== null && to_date !== null) {
        actualFromDate = from_date;
        actualToDate = to_date;
      }
      else {
        actualFromDate = currWageMonth.from_date;
        actualToDate = currWageMonth.to_date;
      }

      // Take 5 days from last wage month for calculating absent status
      fromDate = dateTimeHelper.decreaseDay(actualFromDate, 5)

      // Take 5 days from next wage month for calculating absent status
      toDate = dateTimeHelper.increaseDay(actualToDate, 5)

      console.log("FROM DATE AND TO DATE", fromDate, toDate)
      console.log("ACTUAL FROM DATE AND ACTUAL TO DATE", actualFromDate, actualToDate)
      //---------------------------------------------------------------------------

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

      //---------------------------------------------------------------------------

      let records = {};
      let records_array = [];

      // Iterate for each empWiseRoster record and process the attendance data
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

        //---------------------------------------------------------------------------

        // Assign attendance status to the variable
        let attendance_status = empRoster.attendance_status;

        // Date difference between current day in the iteration and current wage month actualFromDate
        let from_date_diff = dateTimeHelper.compareDate(empRoster.day, actualFromDate)
        let to_date_diff = dateTimeHelper.compareDate(empRoster.day, actualToDate)


        // if (records[empRoster.emp_code].emp_code == '003692' && 
        //     dateTimeHelper.compareDate(empRoster.day, '2019-10-27')) {
        //   console.log(empRoster.day)
        //   console.log(records['003692'])
        // }

        //---------------------------------------------------------------------------

        // Check if employee has been moved to exempted list after roster generation
        isExempted = !employeeGroups.find(empGroup => empGroup.emp_code === empRoster.emp_code)
        if (isExempted) return; // Skip if exempted

        //---------------------------------------------------------------------------

        // If modified status is 1 | Conclusion present
        if (empRoster.modified_status === 1) {
          if (from_date_diff >= 0 && to_date_diff <= 0) {
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
            dateTimeHelper.compareDate(empRoster.day, absentDetail.from_date) >= 0 &&
            dateTimeHelper.compareDate(empRoster.day, absentDetail.to_date) <= 0
          );
        });

        // Employee has applied leave, tour etc
        if (absentDtl) {
          if (from_date_diff >= 0 && to_date_diff <= 0) {
            records[empRoster.emp_code].leave_days.push(empRoster.day);
          }
          // If employee has applied for leave, set prev_day_absent flag to FALSE
          records[empRoster.emp_code].prev_day_absent = false
          return;
        }

        //---------------------------------------------------------------------------

        // If current date is holiday and the employee is from general duty
        if (
          holidays.find(holiday => holiday.day === empRoster.day) &&
          empRoster.shift.is_general
        ) {
          if (from_date_diff >= 0 && to_date_diff <= 0) {
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

        // For shift duty employees, if current date is off
        if (attendance_status === codes.ATTENDANCE_OFF_DAY) {
          if (from_date_diff >= 0 && to_date_diff <= 0) {
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

          isWorkDay = genWorkDays.find(wd => wd.day === empRoster.day) ? true : false
          // If current day (weekend) is not a working day
          if (!isWorkDay && from_date_diff >= 0 && to_date_diff <= 0) {
            // If employee is absent on previous day, add to buffer_days array
            if (records[empRoster.emp_code].prev_day_absent) {
              return records[empRoster.emp_code].buffer_days.push(empRoster.day);
            }
            else {
              return records[empRoster.emp_code].off_days.push(empRoster.day);
            }
          }

          // if current day is working, then continue processing
        }

        //---------------------------------------------------------------------------

        let buffer_days = records[empRoster.emp_code].buffer_days
        let prev_day_absent = records[empRoster.emp_code].prev_day_absent

        //---------------------------------------------------------------------------
        // ABSENT CASE CONDITION
        //---------------------------------------------------------------------------

        if (attendance_status === codes.ATTENDANCE_ABSENT) {
          if (from_date_diff >= 0) {
            // Accept only those days which are less or equal to actualToDate
            if (to_date_diff <= 0) {
              records[empRoster.emp_code].absent_days.push(empRoster.day);
              records[empRoster.emp_code].absent_days_count += 1;
            }

            // If previous_day_absent flag is true and buffer array is not empty
            if (prev_day_absent && buffer_days.length > 0) {
              // Accept only those buffer days which are less or equal to actualToDate
              buffer_days = buffer_days.filter(day => dateTimeHelper.compareDate(day, actualToDate) <= 0)

              records[empRoster.emp_code].absent_days = records[empRoster.emp_code].absent_days.concat(buffer_days)
              records[empRoster.emp_code].absent_days_count += buffer_days.length;

              buffer_days = records[empRoster.emp_code].buffer_days = []
            }
          }

          // Mark 'prev_day_absent' to be used in the next iteration
          records[empRoster.emp_code].prev_day_absent = true
          return;
        }

        //---------------------------------------------------------------------------
        // ALL TYPES OF PRESENT CASE CONDITION
        //---------------------------------------------------------------------------

        else {
          if (from_date_diff >= 0) {
            // Accept only those days which are less or equal to actualToDate
            if (to_date_diff <= 0) {
              if (attendance_status === codes.ATTENDANCE_LATE) {
                records[empRoster.emp_code].late_days.push(empRoster.day);
              }

              if (attendance_status === codes.ATTENDANCE_PRESENT) {
                records[empRoster.emp_code].present_days.push(empRoster.day);
              }

              if (attendance_status === codes.ATTENDANCE_HALF_DAY) {
                records[empRoster.emp_code].half_days.push(empRoster.day);
                records[empRoster.emp_code].absent_days_count += 0.5;
              }
            }

            // If previous_day_absent flag is true and buffer array is not empty
            if (prev_day_absent && buffer_days.length > 0) {
              let off_days = records[empRoster.emp_code].off_days.concat(buffer_days)

              // Accept only those buffer days which are less or equal to actualToDate
              off_days = off_days.filter(day => dateTimeHelper.compareDate(day, actualToDate) <= 0)

              records[empRoster.emp_code].off_days = off_days
              buffer_days = records[empRoster.emp_code].buffer_days = []
            }
          }

          // Mark 'prev_day_absent' to be used in the next iteration
          records[empRoster.emp_code].prev_day_absent = false
          return;
        }
      });

      //---------------------------------------------------------------------------
      // Convert to array from object based on employee code as key

      for (let key in records) {
        records_array.push(records[key]);
      }

      // console.log(records['003692'])

      resolve(records_array)

    } catch (error) {
      console.error("Error : " + error);
      reject(error)
    }
  })
}

module.exports = calculateAbsenteeStatement;
