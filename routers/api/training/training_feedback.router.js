const router = require('express').Router({mergeParams: true})
const trainingFeedback = require('../../../model/training/trainingFeedback.model')

router.route('/')
.get((req, res)=>{
  trainingFeedback.findAll({
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
.post((req, res)=>{
  trainingFeedback
    .build({
      emp_code: req.body.emp_code,
      ta_da_incurred: req.body.ta_da_incurred,
      comments: req.body.comments,
      duration_rating: req.body.duration_rating,
      content_rating: req.body.content_rating,  
      methodology_rating: req.body.methodology_rating,  
      admin_service_rating: req.body.admin_service_rating,  
      overall_utility_rating: req.body.overall_utility_rating,     
      training_info_id: parseInt(req.params.trainingId)
    }) 
    .save()
    .then(result=>{
      console.log(result)
      res.status(200).send(result)
    })
    .catch(error =>{
      console.log(error)
      res.status(500).json({ message: 'Oops! An error occured', error: error })
    })
})

router.route('/:feedbackId')
.delete((req, res)=>{
  trainingFeedback.destroy({ where: { id: req.params.feedbackId }})
    .then(result => res.status(200).json(result))
    .catch(err=>{
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
})
.get((req,res)=>{
  trainingFeedback.findById(req.params.feedbackId)
    .then(result=>res.status(200).json(result))
    .catch(err=>{
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
})
.put((req, res)=>{
  console.log(req.body)
  trainingFeedback.update({ 
      emp_code: req.body.emp_code,
      ta_da_incurred: req.body.ta_da_incurred,
      comments: req.body.comments,
      duration_rating: req.body.duration_rating,
      content_rating: req.body.content_rating,  
      methodology_rating: req.body.methodology_rating,  
      admin_service_rating: req.body.admin_service_rating,  
      overall_utility_rating: req.body.overall_utility_rating,
      // training_info_id: parseInt(req.params.trainingId)
    },
    { where: { id: req.params.feedbackId }
  })
  .then(() => {
    trainingFeedback.findById(req.params.feedbackId)
      .then(result => res.status(200).send(result))
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