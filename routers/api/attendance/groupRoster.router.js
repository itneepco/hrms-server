const router = require('express').Router({mergeParams: true})
const Op = require("sequelize").Op;
const formatDate = require('../shared/functions/formatDate')
const groupRosterModel = require('../../../model/attendance/groupRoster.model')
const groupModel = require('../../../model/attendance/group.model')


router.route('/')
.get((req, res) => {
  
  fromDate = req.query.from_date
  toDate = req.query.to_date
  groupRosterModel
    .findAll({
      include: [
        {
          model: groupModel,
          as: "group",
          where: {project_id: req.params.projectId}        
         }
      ],
      where:{day: {[Op.between]: [fromDate,toDate]}},
      order: [["day", "ASC"]]
    })
    .then(results => {
      let data = results.map(result=>{
        return Object.assign({},{
          day:result.day,
          group_id:result.group_id,
          shift_id:result.shift_id
        })
      })
      arr =[ data.reduce((l,n)=>{
           {
              let t = n.day

              l[t]=l[t]||[]
              l[t].push({group_id:n.group_id,shift_id:n.shift_id})
              return l
            }
      },{})]
     
    
     
      res.status(200).json(arr)
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: "Opps! Some error happened!!" });
    });

})


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