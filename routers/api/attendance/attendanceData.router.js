const router = require('express').Router()
const path = require('path')

const multer  = require('multer')
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
        cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
    let name = file.originalname
    cb(null, name)
  }
})

const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {    
    if (path.extname(file.originalname)!=='.dat'){
      return cb(new Error('Only dat files are allowed'))
    }
    cb(null, true)
  } 
}).array('dataFile')

router.route('/upload')
.get((req,res)=>{
  res.status(200).json({ message:'Successfully uploaded the dat file' })
})

.post((req,res)=>{
  
 upload(req, res, (err) => {
    if(err) {
      console.log(err)
      return res.status(500).json({ message: 'oops error occured', error: err })
    }
     else{
      res.status(200).json({ message:'Successfully uploaded the dat file' })
     }
  })
})
module.exports = router