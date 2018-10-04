const Codes = require('../global/codes');

module.exports = (req, res, next) => {
  // console.log(req.user)
  let user = req.user
  
  if(user && (user.role == Codes.IT_ADMIN_ROLE || 
    user.role == Codes.HR_SITE_ADMIN_ROLE || 
    user.role == Codes.HR_SUPER_ADMIN_ROLE)) {
    
    console.log("User validated")    
    next()
  } 
  else {
    return res.status(403).json({ message: "You are not authorized to access the resource" })
  }
}