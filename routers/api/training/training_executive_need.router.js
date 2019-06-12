const router = require('express').Router({mergeParams: true})
const executiveNeed = require('../../../model/training/trainingExecutiveNeed.model')
const labelModel = require('../../../model/training/trainingLabel.model')

router.route('/')
.get((req, res) => {
  console.log("!!!!!! Request Parameters !!!!!!", req.params)
  executiveNeed.findAll({
    where: {
      training_need_info_id: req.params.needInfoId
    },
    include: [ labelModel ]
  })
  .then(result => {
    console.log(result)
    res.status(200).json(result) 
  })
  .catch(err => {
    console.log(err)
    res.status(500).json({message: 'Opps! Some error happened!!', error: err })
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
      training_need_info_id: req.body.training_need_info_id
    }) 
    .save()
    .then(async (result) => {
      console.log(result)
      let data = await executiveNeed.findById(result.id, {include: [ labelModel ]})
      res.status(200).send(data)
    })
    .catch(err => {
      console.log(err)
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
  executiveNeed.findById(req.params.needId, { include: [ labelModel ] })
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
    },
    { where: { id: req.params.needId }
  })
  .then(() => {
    executiveNeed.findById(req.params.needId, {include: [labelModel]})
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

router.route('/:needId/remarks')
.put((req, res) => {
  console.log(req.body)
  executiveNeed.update({ hod_remarks: req.body.hod_remarks },
    { where: { id: req.params.needId }
  })
  .then(result => res.status(200).json(result))
  .catch(err => {
    console.log(err)
    res.status(500).json({ message: 'Opps! Some error happened!!', error: err })
  })
})

// function getCurrFinYear() {
//   let today = new Date()
//   let year = today.getFullYear()
//   let curr_month = today.getMonth() + 1

//   if(curr_month <= 3) {
//     return (year - 1).toString() + '-' + year.toString()
//   }

//   return year.toString() + '-' + (year + 1).toString()
// }

module.exports = router