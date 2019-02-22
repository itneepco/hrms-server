const router = require('express').Router({mergeParams: true})
const Op = require('sequelize').Op;

const participantModel = require('../../../model/training/trainingParticipant.model')
const projectModel = require('../../../model/project.model')
const gradeModel = require('../../../model/grade.model')
const designationModel = require('../../../model/designation.model')
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
    let filteredData = results.map(data => filterData(data)) 
    res.status(200).json(filteredData) 
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
      training_info_id: parseInt(req.params.trainingId),
      present: false
    }) 
    .save()
    .then(result => {
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
  participantModel.findOne({
    where: { id: req.params.participantId },
    include: [
      { model: projectModel },
      { model: designationModel },
      { model: gradeModel },
      { model: employeeModel }
    ]})
    .then(data => res.status(200).json(filterData(data)))
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

router.route('/attendance/mark')
.put(async (req, res) => {
  console.log("Request Body", req.body)

  let promises = await req.body.map(attendant => {
    return participantModel.update({
        present: attendant.present
      }, {
        where: { 
          training_info_id: req.params.trainingId,
          emp_code: attendant.emp_code 
        }
      })
    })
    
    Promise.all(promises)
    .then(result => {
      console.log(result)
      res.status(200).json({message: "Successfully updated the records"})
    })
    .catch(err => {
      console.log(err)
      res.status(500).json({ error: err, message: 'Opps! Some error occured!!' })
    })
})

function filterData(data) {
  let name = data.employee.first_name + " " + 
    data.employee.middle_name + " " + data.employee.last_name

  return {
    id: data.id,
    name: name,
    designation: data.designation.name,
    grade: data.grade.name,
    project: data.project.name,
    emp_code: data.emp_code,
    training_info_id: data.training_info_id
  }
}

module.exports = router