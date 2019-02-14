const router = require('express').Router()
const trainingTopic = require('../../../model/training/trainingTopic.model')
const codes = require('../../../global/codes')

router.route('/')
.get((req, res)=>{
  trainingTopic.findAll({
    where: {
      training_info_id: req.params.trainingId
    }
  })
  .then(result=>res.status(200).json(result))
  .catch(err=>{
    console.log(err)
    res.status(500).json({message:'Opps! Some error happened!!'})
  })  
})
.post((req,res)=>{
  trainingTopic
    .build({
      topic_name: req.body.topic_name,
      faculty_name: req.body.faculty_name,
      training_info_id: req.params.trainingId
    }) 
    .save()
    .then(result=>{
      console.log(result)
      res.status(200).send({
        topic_name: result.topic_name,
        faculty_name: result.faculty_name,
        training_info_id: result.trainingId
      })
    })
    .catch(error=>{
      console.log(error)
      res.status(500).json({ message: 'Oops! An error occured', error: err })
    })
})

router.route('/:topicId')
.delete((req, res)=>{
  trainingTopic.destroy({ where: { id: req.params.topicId }})
    .then(result => res.status(200).json(result))
    .catch(err=>{
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
})
.get((req,res)=>{
  trainingTopic.findById(req.params.topicId)
    .then(result=>res.status(200).json(result))
    .catch(err=>{
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
})
.put((req, res)=>{
  console.log(req.body)
  trainingTopic.update({ 
      topic_name: req.body.topic_name,
      faculty_name: req.body.faculty_name,
      training_info_id: req.params.trainingId
    },
    { where: { id: req.params.topicId }
  })
  .then(() => {
    trainingTopic.findById(req.params.topicId)
      .then(result => {
        res.status(200).send({
          topic_name: result.topic_name,
          faculty_name: result.faculty_name,
          training_info_id: result.trainingId
        })
      })
      .catch(err =>{
        console.log(err) 
        res.status(500).json({ message:'Opps! Some error happened!!', error: err })
      })
  })
  .catch(err => {
    console.log(err)
    res.status(500).json({ message:'Opps! Some error happened!!', error: err })
  })
})

module.exports = router