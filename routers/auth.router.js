const express = require('express');
const User = require('../model/shared/user.model');
const Employee = require('../model/shared/employee.model');
const Grade = require('../model/shared/grade.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt-nodejs');
const secret = require('../config/secret');
const roleMapper = require('../model/shared/roleMapper.model');
const jwtExtractor = require('../middlewares/jwtExtractor');
const sendEmail = require('./functions/send-email');
const generatePassword = require('./functions/generate-password');
const AuthRouter = express.Router();

AuthRouter.route('/login')
  .post((req, res) => {
    const emp_code = req.body.emp_code
    const password = req.body.password

    User.findOne({ where: { emp_code: emp_code } })
      .then(user => {
        if (!user) return res.status(404).json({ message: "User Not Found" })

        bcrypt.compare(password, user.password_digest, (err, result) => {
          if (!err & result) {
            roleMapper.findAll({ where: { emp_code: user.emp_code } })
              .then(async (results) => {
                let employee = await Employee.findOne({
                  attributes: ['emp_code', 'project_id'],
                  include: { model: Grade },
                  where: { emp_code: user.emp_code }
                })

                let data = {
                  emp_code: user.emp_code,
                  name: user.user_name,
                  role: user.role,
                  project: employee.project_id,
                  grade: employee.grade.name,
                  roleMapper: results
                };

                const token = jwt.sign(data, secret, { expiresIn: '3000s' })
                console.log("Login successful")
                res.status(200).json({ token, message: "Success" })
              })
          }
          else {
            res.status(401).json({ message: 'Authentication Failed' })
          }
        })
      })
      .catch(err => {
        console.log(err)
        res.status(500).json({ message: 'An error occured' })
      })
  })

AuthRouter.put('/change-password', jwtExtractor, (req, res) => {
  const old_password = req.body.old_password
  const new_password = req.body.new_password
  const emp_code = req.body.emp_code

  User.findOne({ where: { emp_code: emp_code } })
  .then(userData => {
    bcrypt.compare(old_password, userData.password_digest, (err, success) => {
      if (!err & success) {
        bcrypt.genSalt(10, (err, salt) => {
          if (err) {
            console.log(err)
            return res.status(500).json({ message: 'An error occured' })
          }
          bcrypt.hash(new_password, salt, null, (err, hash) => {
            if (err) {
              console.log(err)
              return res.status(500).json({ message: 'An error occured' })
            }
            userData.update({ password_digest: hash })
            .then(data => {
              console.log("Password changed successfully", data)
              return res.status(200).json({ message: 'Successfully changed the password' })
            })
          })
        })
      }
      else {
        res.status(422).json({ message: 'Invalid old password' })
      }
    })
  })
  .catch(err => {
    console.log(err)
    res.status(500).json({ message: 'An error occured' })
  })
})

AuthRouter.route('/reset-password')
  .post(async (req, res) => {
    const emp_code = req.body.emp_code
    const email = req.body.email

    try {
      const employee = await Employee.findOne({
        where: {
          email: email,
          emp_code: emp_code
        }
      })

      if (!employee) {
        return res.status(404).json({
          message: "Either employee code or email id does not exists!!"
        })
      }

      const result = await generatePassword(employee.emp_code)
      console.log("Result: ", result)
      
      await sendEmail(employee, result.password)
      await User.update({ password_digest: result.hash }, { where: { emp_code: emp_code } })
      
      res.status(200).json({ message: "Your new password has been sent to your email" })
    }
    catch (error) {
      console.log(error)
      res.status(500).json({ message: 'An error occured! Please try again later!', error: error })
    }
  })

module.exports = AuthRouter
