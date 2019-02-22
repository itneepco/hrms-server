
const jwt = require('jsonwebtoken');
const secret = require('../config/secret');
const User = require('../model/user.model');
const RoleMapper = require('../model/roleMapper.model');

module.exports = (req, res, next) => {
  // console.log(req.headers.authorization)
  const bearer = req.headers.authorization.split(" ")[1];
  
  jwt.verify(bearer, secret, (err, decoded)=>{
    if (err) return res.status(401).send({message: "Failed to authenticate token", error: err});

    User.findOne({
      where: { emp_code: decoded.emp_code },
    })
    .then(user => {
      console.log("User Validation! Current user found in the database!")
      if (!user) return res.status(404).send({ message: "No user found." });
      
      return RoleMapper.findAll({
        where: { emp_code: user.emp_code }
      })
      .then((results) => {
        let data = {
          emp_code: user.emp_code,
          name: user.user_name,
          role: user.role,
          project_id: user.project_id,
          roleMapper: results
        };

        req.user = data
        next()
      })
    })
    .catch(err => {
      console.log(err)
      return res.status(500).send({ message: "There was a problem finding the user.", error: err });
    })
  })
}