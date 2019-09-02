const employeeGroup = require('../../../../model/attendance/employeeGroup.model')

function getEmpGroup(empCode) {
  return employeeGroup.find({
    where: { emp_code: empCode }
  }).then(result => {
    if (!result) return null
    let empGroup = Object.assign({}, {
      id: result.id,
      group_id: result.group_id,
      emp_code: result.emp_code
    })
    return empGroup
  })
}

module.exports = getEmpGroup