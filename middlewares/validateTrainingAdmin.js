const Codes = require('../global/codes');

module.exports = (req, res, next) => {
  // console.log(req.user)
  let curr_user = req.user
  
  if(curr_user && (curr_user.role == Codes.IT_ADMIN_ROLE || 
      curr_user.roleMapper.find(mapper => mapper.role == Codes.TRAINING_ADMIN))) {
    
    console.log("User validated")    
    next()
  } 
  else {
    return res.status(403).json({ message: "You are not authorized to access the resource" })
  }
}