const router = require("express").Router({mergeParams: true})
const generalRosterModel = require("../../../model/attendance/generalRoster.model")
const groupModel = require('../../../model/attendance/group.model')

router.route('/')
.get((req, res) => { 
    generalRosterModel
    .findAll({
      include:[{model:groupModel,as:'group',  where: { project_id: req.params.projectId }}]     
    })

    .then(result => res.status(200).json(result))
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: "Opps! Some error occured!!" })
    })
})
.post((req,res) =>{
  generalRosterModel.build({
    shift_id: req.body.shift_id,
    group_id: req.body.group_id   
  })
  .save()
  .then(result=>{
    console.log(result)
    res.status(200).send(result)
  })
  .catch(err=>{
    console.log(err)
    res.status(500).json('Oops! some error occured!!')
  })
})

router.route('/:id')
.get((req,res)=>{
  generalRosterModel.findById(req.params.id)
  .then(result=>res.status(200).json(result))
  .catch(err=>{
    console.log(err)
    res.status(500).json('Oops! some error occured')
  })
})

.put((req,res)=>{
        generalRosterModel.update({shift_id:req.body.shiftId,group_id:req.body.groupId},
        {where: {id:req.params.id}})
    .then(() => {
        generalRosterModel.findById(req.params.id)
        .then(result=>res.status(200).json(result))
        .catch(err =>{
            console.log(err) 
            res.status(500).json({message:'Opps! Some error happened!!'})
        })
    })
    .catch(err=>{
        console.log(err)
        res.status(500).json({message:'Opps! Some error happened!!'})
    }
    )
})
.delete((req,res)=>{
  generalRosterModel.destroy({where: {id:req.params.id}})
  .then(result=>res.status(200).json(result))
  .catch(err=>{
      console.log(err)
      res.status(500).json({message:'Opps! Some error happened!!'})
  }
  )
})

module.exports = router