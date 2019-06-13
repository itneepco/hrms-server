const router = require('express').Router()
const needsInfoModel = require('../../../model/training/trainingNeedsInfo.model')
const employeeModel = require('../../../model/shared/employee.model')
const needsInfoHist = require('../../../model/training/needsInfoHist.model')

// Get the all training needs info of the specified employee 
router.route('/employee/:empCode')
.get((req, res) => { 
  needsInfoModel.findAll({
    where: {
      emp_code: req.params.empCode
    },
    include: { 
      model: employeeModel, 
      attributes: ['emp_code', 'first_name', 'middle_name', 'last_name'],
    },
  })
  .then(data => res.status(200).json(data))
  .catch(err => {
    console.log(err)
    res.status(500).json({message: 'Opps! Some error happened!!', error: err })
  })  
})

// Get all pending request for the specified employee (Training needs workflow)
router.route('/pending/:empCode')
.get((req, res) => { 
  needsInfoModel.findAll({
    where: {
      addressee: req.params.empCode
    },
    include: { 
      model: employeeModel, 
      attributes: ['emp_code', 'first_name', 'middle_name', 'last_name'],
    },
  })
  .then(data => res.status(200).json(data))
  .catch(err => {
    console.log(err)
    res.status(500).json({message: 'Opps! Some error happened!!', error: err })
  })  
})

// Get all pending request count for the specified employee (Training needs workflow)
router.route('/pending/:empCode/count')
.get((req, res) => { 
  needsInfoModel.count({
    where: { addressee: req.params.empCode }
  })
  .then(count => res.status(200).json(count))
  .catch(err => {
    console.log(err)
    res.status(500).json({message: 'Opps! Some error happened!!', error: err })
  })  
})

// Get the training needs info based on the specified id
router.route('/:needsInfoId')
.get((req,res)=>{
  needsInfoModel.findById(req.params.needsInfoId, {
    include: [
      { 
        model: employeeModel, 
        attributes: ['emp_code', 'first_name', 'middle_name', 'last_name'],
      },
      { 
        model: needsInfoHist,
        include: {
          model: employeeModel,
          as: "officer",
          attributes: ['emp_code', 'first_name', 'middle_name', 'last_name'],
        } 
      }
    ]
  })
  .then(result => res.status(200).json(result))
  .catch(err => {
    console.log(err)
    res.status(500).json({ message:'Opps! Some error happened!!', error: err })
  })
})

module.exports = router