const roleMapperModel = require('../../../model/shared/roleMapper.model');
const Codes = require('../../../global/codes')

var exports = module.exports = {};

exports.checkElHplRole = function(req, res) {
  return roleMapperModel.findOne({
    where: {
      emp_code: req.params.empCode,
      role: Codes.RMAP_EL_HPL
    }
  })
  .then(roleMapper => {
    if (!roleMapper) return null
    
    return roleMapper
  })
  .catch(err => {
    console.log(err)
    return null
  })
}

exports.checkLeaveSuperAdminRole = function(req, res) {
  return roleMapperModel.findOne({
    where: {
      emp_code: req.params.empCode,
      role: Codes.HR_LEAVE_SUPER_ADMIN
    }
  })
  .then(roleMapper => {
    if (!roleMapper) return null
    
    return roleMapper
  })
  .catch(err => {
    console.log(err)
    return null
  })
}