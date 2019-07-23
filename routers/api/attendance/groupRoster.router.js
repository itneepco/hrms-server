const router = require('express').Router({mergeParams: true})
const db = require('../../../config/db')

const groupRosterModel = require('../../../model/attendance/groupRoster.model')

router.route('/')
.post(async(req,res)=>{
 let groupDutyRoster = await req.body.map(val=>val.group_shifts.map(data=>
     Object.assign({day:val.day,created_by: req.user.emp_code, updated_by:req.user.emp_code},data)
  )).reduce((l,n)=>l.concat(n),[])

  groupRosterModel.bulkCreate(groupDutyRoster,{updateOnDuplicate:true})
  .then(result=> res.status(200).json(result))
  .catch(err => {
    console.log(err);
    res.status(500).json({ message: "Opps! Some error occured!!" })
  })

  
})

module.exports =router