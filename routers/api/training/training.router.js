const router = require('express').Router()
const trainingInfo = require('../../../model/training/trainingInfo.model')

router.route('/')
.get((req, res)=>{
  trainingInfo.findAll({ 
      order: [['from_date', 'ASC']]
    })
    .then(result => res.status(200).json(result))
    .catch(err => {
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
})
.post((req,res)=>{
  trainingInfo
    .build({
      course_title: req.body.course_title,
      from_date: req.body.from_date,
      to_date: req.body.to_date,
      venue: req.body.venue,
      objective: req.body.objective,
      training_type: req.body.training_type,
      training_institue_id: req.body.training_institue_id
    }) 
    .save()
    .then(result=>{
      console.log(result)
      res.status(200).send(result)
    })
    .catch(error=>{
      console.log(error)
      res.status(500).json({ message: 'Oops! An error occured', error: err })
    })
})

router.route('/:id')
.delete((req, res)=>{
  trainingInfo.destroy({ where: { id: req.params.id }})
    .then(result => res.status(200).json(result))
    .catch(err=>{
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
})
.get((req,res)=>{
  trainingInfo.findById(req.params.id)
    .then(result=>res.status(200).json(result))
    .catch(err=>{
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
})
.put((req,res)=>{
  trainingInfo.update({ 
      course_title: req.body.course_title,
      from_date: req.body.from_date,
      to_date: req.body.to_date,
      venue: req.body.venue,
      objective: req.body.objective,
      training_type: req.body.training_type,
      training_institue_id: req.body.training_institue_id
    },
    { where: {id: req.params.id }
  })
  .then(() => {
    trainingInfo.findById(req.params.id)
      .then(result=>res.status(200).json(result))
      .catch(err =>{
        console.log(err) 
        res.status(500).json({ message:'Opps! Some error happened!!', error: err })
      })
  })
  .catch(err=>{
    console.log(err)
    res.status(500).json({ message:'Opps! Some error happened!!', error: err })
  })
})

module.exports = router