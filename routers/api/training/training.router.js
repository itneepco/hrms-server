const router = require('express').Router()
const trainingInfo = require('../../../model/training/trainingInfo.model')
const codes = require('../../../global/codes')

router.route('/')
.get((req, res)=>{
  let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0
  let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50
  let offset = pageIndex * limit

  trainingInfo.findAndCountAll({ 
      order: [['from_date', 'ASC']],
      limit: limit,
      offset: offset
  })
  .then(result=>res.status(200).json(result))
  .catch(err=>{
      console.log(err)
      res.status(500).json({message:'Opps! Some error happened!!'})
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
      training_institute_id: req.body.training_institute_id,
      status: codes.TRAINING_CREATED
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
  console.log(req.body)
  trainingInfo.update({ 
      course_title: req.body.course_title,
      from_date: req.body.from_date,
      to_date: req.body.to_date,
      venue: req.body.venue,
      objective: req.body.objective,
      training_type: req.body.training_type,
      training_institute_id: req.body.training_institute_id
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