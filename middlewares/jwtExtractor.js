
const jwt = require('jsonwebtoken');
const secret = require('../config/secret');
const User = require('../model/user.model');

module.exports = (req, res, next) => {
  // console.log(req.headers.authorization)
  const bearer = req.headers.authorization.split(" ")[1];
  
  jwt.verify(bearer, secret, (err, decoded)=>{
    if (err) return res.status(401).send({message: "Failed to authenticate token", error: err});

    User.findOne({
      where: { emp_code: decoded.emp_code }
    })
    .then(user => {
      console.log("User Validation! Current user found in the database!")
      if (!user) return res.status(404).send({ message: "No user found." });
      
      req.user = user
      next()
    })
    .catch(err => {
      return res.status(500).send({ message: "There was a problem finding the user." });
    })
  })
}