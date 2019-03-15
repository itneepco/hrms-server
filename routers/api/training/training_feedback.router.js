const router = require('express').Router({mergeParams: true})
const trainingFeedback = require('../../../model/training/trainingFeedback.model')
const trngTopicRating = require('../../../model/training/trainingTopicRating.model')
const db = require('../../../config/db');

router.route('/')
.get((req, res)=>{
  trainingFeedback.findAll({
    order: [['training_info_id', 'DESC']],
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
  db.transaction().then(t => { 
    trainingFeedback
    .create({
      emp_code: req.body.emp_code,
      ta_da_incurred: req.body.ta_da_incurred,
      comments: req.body.comments,
      duration_rating: req.body.duration_rating,
      content_rating: req.body.content_rating,  
      methodology_rating: req.body.methodology_rating,  
      admin_service_rating: req.body.admin_service_rating,  
      overall_utility_rating: req.body.overall_utility_rating,     
      training_info_id: parseInt(req.params.trainingId)
    }, { transaction: t })
    
    .then((result) => {
      // console.log(result)
      let topicRatings = req.body.topic_ratings.map(topicRating => {
        return Object.assign({}, { 
          emp_code: topicRating.emp_code, 
          training_topic_id: topicRating.training_topic_id, 
          rating: topicRating.rating 
        })
      })
      
      return trngTopicRating.bulkCreate(topicRatings, { transaction: t })
    })
    .then(result => {
      console.log(result)
      res.status(200).json({ message: "Successfully submitted the feedback" })
      return t.commit();
    })
    .catch(error =>{
      console.log(error)
      res.status(500).json({ message: 'Oops! An error occured', error: error })
      return t.rollback();
    })
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
  db.transaction().then(t => { 
    trainingFeedback
    .update({ 
        emp_code: req.body.emp_code,
        ta_da_incurred: req.body.ta_da_incurred,
        comments: req.body.comments,
        duration_rating: req.body.duration_rating,
        content_rating: req.body.content_rating,  
        methodology_rating: req.body.methodology_rating,  
        admin_service_rating: req.body.admin_service_rating,  
        overall_utility_rating: req.body.overall_utility_rating,
      }, 
      { where: { id: req.params.feedbackId }}, 
      { transaction: t }
    )
    .then(() => {
      let promises = req.body.topic_ratings.map(data => {
        return trngTopicRating.update(
          { rating: data.rating },
          { where: { emp_code: req.user.emp_code, training_topic_id: data.training_topic_id }},
          { transaction: t }
        )
      })
      return Promise.all(promises)
    })
    .then(() => {
      res.status(200).json({ message: "Successfully update the feedback" })
      return t.commit();
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
  })
})

module.exports = router