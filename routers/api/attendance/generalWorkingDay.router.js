const router = require("express").Router({mergeParams: true})
const genWorkDayModel = require("../../../model/attendance/generalWorkingDay.model")

router.route('/')
.get((req, res) => { 
  genWorkDayModel
    .findAll({
      where: { project_id: req.params.projectId }
    })

    .then(result => res.status(200).json(result))
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: "Opps! Some error occured!!" })
    })
})
.post((req,res) =>{
  genWorkDayModel.build({
    day: req.body.day,
    project_id: req.params.projectId   
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
  genWorkDayModel.findById(req.params.id)
  .then(result=>res.status(200).json(result))
  .catch(err=>{
    console.log(err)
    res.status(500).json('Oops! some error occured')
  })
})

.put((req,res)=>{
       genWorkDayModel.update({day:req.body.day},
        {where: {id:req.params.id}})
    .then(() => {
       genWorkDayModel.findById(req.params.id)
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
  genWorkDayModel.destroy({where: {id:req.params.id}})
  .then(result=>res.status(200).json(result))
  .catch(err=>{
      console.log(err)
      res.status(500).json({message:'Opps! Some error happened!!'})
  }
  )
})

module.exports = router