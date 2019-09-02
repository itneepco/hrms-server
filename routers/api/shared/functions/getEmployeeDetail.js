const employeeModel = require('../../../../model/shared/employee.model')
const projectModel = require('../../../../model/shared/project.model')
const designationModel = require('../../../../model/shared/designation.model')

function getEmployeeDetail(empCode) {
  return employeeModel.findOne({
    where: { emp_code: empCode },
    include: [
      { model: projectModel },
      { model: designationModel }
    ]
  }).then(emp => {
    if (!emp) return null
    let employee = Object.assign({},
      {
        emp_code: emp.emp_code,
        first_name: emp.first_name,
        middle_name: emp.middle_name,
        last_name: emp.last_name,
        designation: emp.designation.name,
        project: emp.project.name
      }
    )
    return employee
  })
}

module.exports = getEmployeeDetail