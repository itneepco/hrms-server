const User = require('../../model/shared/user.model');
const bcrypt = require('bcrypt-nodejs');

function generatePassword() {
  return new Promise(async (resolve, reject) => {
    try {
      const password = Math.random().toString(36).substr(7)
      // console.log("Password", password)

      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          return reject(err)
        }
        // console.log("salt", salt)

        bcrypt.hash(password, salt, null, (err, hash) => {
          if (err) {
            return reject(err)
          }
          // console.log("hash", hash)
          // await user.update({ password_digest: hash })
          resolve({ password, hash })
        })
      })
    }
    catch (error) {
      reject(error)
    }
  })
}

module.exports = generatePassword