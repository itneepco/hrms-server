const nodemailer = require('nodemailer');
const mail_conf = require('../../config/mail')

const mailTransport = nodemailer.createTransport({
  service: 'gmail',
  // proxy: 'http://10.8.1.150:3128',
  auth: {
    user: mail_conf.email,
    pass: mail_conf.password,
  }
});

function sendEmail(employee, new_passwd) {
  const name = employee.first_name + ' ' + employee.middle_name + ' ' + employee.last_name
  const mailOptions = {
    // from: '"NEEPCO HRMS." <noreply@neepcohrms.com>',
    from: 'nrms4neepco@gmail.com',
    to: employee.email.toLowerCase(),
    subject: `Password reset for your NEEPCO HRMS account`,
    html: `
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your new password for HRMS is <strong>${new_passwd}</strong></p>
      <p>Please use your new password to login to HRMS</p>
		`
  };

  console.log("Name: ", name, " Email: ", employee.email.toLowerCase())

  return mailTransport.sendMail(mailOptions)
}

module.exports = sendEmail