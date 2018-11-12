const express = require('express');
const User = require('../model/user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt-nodejs');
const secret = require('../config/secret');
const roleMapper = require('../model/roleMapper.model');
const jwtExtractor = require('../middlewares/jwtExtractor');

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

    User.findOne({
      where: { emp_code: emp_code }
    })
    .then(userData => {
      bcrypt.compare(old_password, userData.password_digest, (err, success) => {
        if (!err & success) {
          bcrypt.genSalt(10, (err, salt) => {
            if(err) {
              console.log(err)
              return res.status(500).json({ message: 'An error occured' })
            }
            bcrypt.hash(new_password, salt, null, (err, hash) => {
              if(err) {
                console.log(err)
                return res.status(500).json({ message: 'An error occured' })
              }  
              User.update({
                password_digest: hash
              }, 
              {
                where: { emp_code: req.user.emp_code }
              }).then(data => {
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


module.exports = AuthRouter
