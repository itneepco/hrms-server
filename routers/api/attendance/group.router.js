const router = require("express").Router({mergeParams: true})
const db = require("../../../config/db")
const groups = require("../../../model/attendance/group.model")

router.route('/')
.get((req, res) => {
  groups
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
  groups.build({
    name: req.body.name,
    project_id: req.params.projectId,
    is_general: req.body.is_general
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
  groups.findById(req.params.id)
  .then(result=>res.status(200).json(result))
  .catch(err=>{
    console.log(err)
    res.status(500).json('Oops! some error occured')
  })
})

.put((req,res)=>{
    groups.update({name:req.body.name,is_general:req.body.is_general},
        {where: {id:req.params.id}})
    .then(() => {
        groups.findById(req.params.id)
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
  groups.destroy({where: {id:req.params.id}})
  .then(result=>res.status(200).json(result))
  .catch(err=>{
      console.log(err)
      res.status(500).json({message:'Opps! Some error happened!!'})
  }
  )
})

module.exports = router