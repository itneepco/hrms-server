
const jwt = require('jsonwebtoken');
const secret = require('../config/secret');
const User = require('../model/shared/user.model');
const RoleMapper = require('../model/shared/roleMapper.model');
const Employee = require('../model/shared/employee.model')

module.exports = (req, res, next) => {
  // console.log(req.headers.authorization)
  const bearer = req.headers.authorization.split(" ")[1];
  
  jwt.verify(bearer, secret, (err, decoded)=>{
    if (err) {
      return res.status(401).send({
        message: "Failed to authenticate token", 
        error: err
      });
    }

    User.findOne({
      where: { emp_code: decoded.emp_code },
    })
    .then(async user => {
      if (!user) return res.status(404).send({ message: "No user found." });
      
      console.log("User Validation! Current user found in the database!")

      const roles = await RoleMapper.findAll({
        where: { emp_code: user.emp_code }
      })

      const employee = await Employee.findOne({
        attributes: ['emp_code', 'project_id'],
        where: { emp_code: user.emp_code }
      })

      let data = {
        emp_code: user.emp_code,
        name: user.user_name,
        role: user.role,
        project_id: employee ? employee.project_id : user.project_id,
        roleMapper: roles
      };

      console.log("User Detail", data)

      req.user = data
      next()
    })
    .catch(err => {
      console.log(err)
      return res.status(500).send({ message: "There was a problem finding the user.", error: err });
    })
  })
}