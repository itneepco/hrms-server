const Codes = require('../global/codes');

module.exports = (req, res, next) => {
  // console.log(req.user)
  let curr_user = req.user
  
  console.log("PROJECT ID", req.params.projectId)
  if(curr_user && curr_user.project_id == req.params.projectId) {
    
    console.log("Employee project validated")    
    next()
  } 
  else {
    return res.status(403).json({ message: "You are not authorized to access the resource" })
  }
}