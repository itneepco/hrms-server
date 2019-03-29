const router = require('express').Router({mergeParams:true})
const instituteModel = require('../../../model/training/trainingInstitute.model')
const Op = require('sequelize').Op

router.route('/search')
.get((req, res) => {
  console.log(req.query.name)
  instituteModel.findAll({
    order: [['name', 'ASC']],
    where: {
      name: {
        [Op.like]: "%" + req.query.name + "%"
      }
    }
  })
  .then(results => {
    console.log(results)
    res.status(200).json(results) 
  })
  .catch(error => {
    console.log(error)
    res.status(500).json({ message: 'An error occured', error: err })
  })
})

router.route('/paginate')
.get((req,res)=>{
    let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0
    let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50
    let offset = pageIndex * limit

    instituteModel.findAndCountAll({ 
      order: [['name', 'ASC']],
      limit: limit,
      offset: offset
    })
    .then(result => res.status(200).json(result))
    .catch(err => {
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
})

router.route('/')
.get((req, res)=>{
  instituteModel.findAll({ 
      order: [['name', 'ASC']]
    })
    .then(result => { 
      // console.log(result)
      res.status(200).json(result) 
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
})
.post((req,res)=>{
  instituteModel
    .build({
      name: req.body.name,
      address: req.body.address,
      website: req.body.website,
      contact_no: req.body.contact_no,
      contact_person: req.body.contact_person
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
.delete((req,res)=>{
  instituteModel.destroy({ where: { id: req.params.id }})
    .then(result=>res.status(200).json(result))
    .catch(err=>{
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
})
.get((req,res)=>{
  instituteModel.findById(req.params.id)
    .then(result=>res.status(200).json(result))
    .catch(err=>{
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
})
.put((req,res)=>{
  instituteModel.update({ 
      name: req.body.name,
      address: req.body.address,
      website: req.body.website,
      contact_no: req.body.contact_no,
      contact_person: req.body.contact_person 
    },
    { where: {id: req.params.id } })
  .then(() => {
    instituteModel.findById(req.params.id)
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