const router = require('express').Router()
const labelModel = require('../../../model/training/trainingLabel.model')
const executiveNeed = require('../../../model/training/trainingExecutiveNeed.model')

router.route('/labels')
.get((req, res) => {
  labelModel.findAll({ 
      order: [['name', 'ASC']]
    })
    .then(result => res.status(200).json(result))
    .catch(err => {
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
})

router.route('/employee/:empCode')
.get((req, res) => {
  let condition = {
    emp_code: req.params.empCode
  }

  if(req.query.year) {
    condition['year'] = req.query.year
  }
  
  executiveNeed.findAll({
    order: [['year', "DESC"]],
    where: condition
  })
  .then(result => res.status(200).json(result))
  .catch(err => {
    console.log(err)
    res.status(500).json({message: 'Opps! Some error happened!!'})
  })  
})

router.route('/')
.post((req, res) => {
  executiveNeed
    .build({
      need_type: req.body.need_type,
      duration: req.body.duration,
      training_label_id: req.body.training_label_id,
      topic: req.body.topic,
      emp_code: req.body.emp_code,
      year: req.body.year,
    }) 
    .save()
    .then(result => {
      console.log(result)
      res.status(200).send(result)
    })
    .catch(error => {
      console.log(error)
      res.status(500).json({ message: 'Oops! An error occured', error: err })
    })
})

router.route('/:needId')
.delete((req, res) => {
  executiveNeed.destroy({ where: { id: req.params.needId }})
    .then(result => res.status(200).json(result))
    .catch(err=>{
      console.log(err)
      res.status(500).json({ message: 'Opps! Some error happened!!', error: err })
    })
})
.get((req,res) => {
  executiveNeed.findById(req.params.needId)
    .then(result => res.status(200).json(result))
    .catch(err=>{
      console.log(err)
      res.status(500).json({ message: 'Opps! Some error happened!!', error: err })
    })
})
.put((req, res) => {
  console.log(req.body)
  executiveNeed.update({ 
      need_type: req.body.need_type,
      duration: req.body.duration,
      training_label_id: req.body.training_label_id,
      topic: req.body.topic,
      emp_code: req.body.emp_code,
      year: req.body.year,
    },
    { where: { id: req.params.needId }
  })
  .then(() => {
    executiveNeed.findById(req.params.needId)
      .then(result => res.status(200).json(result))
      .catch(err =>{
        console.log(err) 
        res.status(500).json({ message: 'Opps! Some error happened!!', error: err })
      })
  })
  .catch(err => {
    console.log(err)
    res.status(500).json({ message: 'Opps! Some error happened!!', error: err })
  })
})

module.exports = router