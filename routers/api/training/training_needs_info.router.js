const router = require('express').Router()
const needsInfoModel = require('../../../model/training/trainingNeedsInfo.model')
const employeeModel = require('../../../model/shared/employee.model')
const needsInfoHist = require('../../../model/training/needsInfoHist.model')

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