const express = require('express');
const User = require('../model/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt-nodejs');
const secret = require('../config/secret');
const roleMapper = require('../model/roleMapper.model');

const AuthRouter = express.Router();

AuthRouter.route('/login')
  .post((req, res) => {
    const emp_code = req.body.emp_code
    const password = req.body.password

    User.findOne({
      where: { emp_code: emp_code }
    })
    .then(user => {
      bcrypt.compare(password, user.password_digest, (err, result) => {
        if (!err & result) {
          roleMapper.findAll({
            where: { emp_code: user.emp_code }
          })
          .then((results) => {
            let data = {
              emp_code: user.emp_code,
              name: user.user_name,
              role: user.role,
              project: user.project_id,
              roleMapper: results
            };
            const token = jwt.sign(data, secret, { expiresIn: '3000s' })
            res.status(200).json({ token, messgae: "Success" })
          })
        }
        else {
          res.status(401).json({ messgae: 'Authentication Failed' })
        }
      })
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ messgae: 'An error occured' })
    })
  })

module.exports = AuthRouter
