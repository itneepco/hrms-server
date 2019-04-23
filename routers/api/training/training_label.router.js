const router = require('express').Router()
const labelModel = require('../../../model/training/trainingLabel.model')
const Op = require('sequelize').Op

router.route('/')
.get((req, res)=>{
  labelModel.findAll({ 
      order: [['name', 'ASC']]
    })
    .then(result => res.status(200).json(result))
    .catch(err => {
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
})
.post((req,res)=>{
  labelModel
    .save({
      name: req.body.name
    })
    .then(result=>{
      console.log(result)
      res.status(200).send(result)
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ message: 'Oops! An error occured', error: err })
    })
})

router.route('/:id')
.delete((req,res)=>{
  labelModel.destroy({ where: { id: req.params.id }})
    .then(result=>res.status(200).json(result))
    .catch(err=>{
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
})
.get((req,res)=>{
  labelModel.findById(req.params.id)
    .then(result=>res.status(200).json(result))
    .catch(err=>{
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
})
.put((req,res)=>{
  labelModel.update({ name: req.body.name },
    { where: { id: req.params.id } })
  .then(() => {
    labelModel.findById(req.params.id)
      .then(result => res.status(200).json(result))
      .catch(err => {
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