const router = require('express').Router({mergeParams: true})
const participantModel = require('../../../model/training/tainingParticipant.model')
const employeeModel = require('../../../model/employee.model')

router.route('/')
.get((req, res) => {
  participantModel.findAll({
    where: {
      training_info_id: req.params.trainingId
    },
    attributes: { exclude: ['project_id', 'grade_id', 'designation_id'] },
    include: [
      { model: projectModel },
      { model: designationModel },
      { model: gradeModel },
      { model: employeeModel }
    ]
  })
  .then(results => {
    let filter = results.map(result => {
      return filterData(result)
    }) 
    res.status(200).json(filter) 
  })
  .catch(err=>{
    console.log(err)
    res.status(500).json({message:'Opps! Some error happened!!'})
  })  
})

.post(async (req, res) => {
  try {
    let emp = await employeeModel.findOne({where: { emp_code: req.body.emp_code }})
    if(!emp) return res.status(500).json({ message: 'Cannot find employee with code ' + req.body.emp_code })

    participantModel
      .build({
        emp_code: emp.emp_code,
        project_id: emp.project_id,
        designation_id: emp.designation_id,
        grade_id: emp.grade_id,
        training_info_id: parseInt(req.params.trainingId)
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
  }
  catch(error) {
    console.log(error)
    res.status(500).json({ message: 'Oops! An error occured', error: err })
  }
})

router.route('/:participantId')
.delete((req, res)=>{
  participantModel.destroy({ where: { id: req.params.participantId }})
    .then(result => res.status(200).json(result))
    .catch(err=>{
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
})

.get((req,res)=>{
  participantModel.findById(req.params.participantId)
    .then(result=>res.status(200).json(result))
    .catch(err=>{
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
})

.put(async (req, res)=>{
  try {
    let emp = await employeeModel.findOne({where: { emp_code: req.body.emp_code }})
    if(!emp) return res.status(500).json({ message: 'Cannot find employee with code ' + req.body.emp_code })
    
    participantModel
      .update({ 
        emp_code: emp.emp_code,
        project_id: emp.project_id,
        designation_id: emp.designation_id,
        grade_id: emp.grade_id,
        training_info_id: parseInt(req.params.trainingId)
      },
      { where: { id: req.params.participantId }
    })
    .then(() => {
      participantModel.findById(req.params.participantId)
        .then(result => res.status(200).json(result))
        .catch(err =>{
          console.log(err) 
          res.status(500).json({ message:'Opps! Some error happened!!', error: err })
        })
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
  }
  catch(error) {
    console.log(error)
    res.status(500).json({ message: 'Oops! An error occured', error: err })
  }
})

function filterData(data) {
  return Object.assign(
    {},
    {
      id: data.id,
      emp_code: data.employee
    }
  )
}

module.exports = router