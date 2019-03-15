const router = require('express').Router()
const Op = require('sequelize').Op;

const trainingInfo = require('../../../model/training/trainingInfo.model')
const trainingInstitute = require('../../../model/training/trainingInstitute.model')
const trainingTopic = require('../../../model/training/trainingTopic.model')
const trainingParticipant = require('../../../model/training/trainingParticipant.model')
const projectModel = require('../../../model/project.model')
const gradeModel = require('../../../model/grade.model')
const designationModel = require('../../../model/designation.model')
const employeeModel = require('../../../model/employee.model')
const trainingFeedback = require('../../../model/training/trainingFeedback.model')
const codes = require('../../../global/codes')

router.route('/')
.get((req, res)=>{
  let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0
  let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50
  let offset = pageIndex * limit

  let condition = { project_id: req.user.project_id }
  if(req.query.status == 'archived') {
    condition['status'] = codes.TRAINING_COMPLETED
  } else {
    condition['status'] = { [Op.not]: codes.TRAINING_COMPLETED }
  }

  trainingInfo.findAndCountAll({ 
    distinct: true,
    order: [['from_date', 'ASC']],
    limit: limit,
    offset: offset,
    attributes: { exclude: ['training_institute_id'] },
    where: condition,
    include: [
      { model: trainingInstitute },
      { model: trainingTopic },
      { model: trainingFeedback },
      { 
        model: trainingParticipant,
        include: [
          { model: projectModel },
          { model: designationModel },
          { model: gradeModel },
          { model: employeeModel }
        ] 
      }
    ]
  })
  .then(results => { 
    // console.log(result)
    let training = results.rows.map(result => Object.assign({},
      {
        id: result.id,
        course_title: result.course_title,
        from_date: result.from_date,
        to_date: result.to_date,
        venue: result.venue,
        objective: result.objective,
        training_type: result.training_type,
        training_institute: result.training_institute, 
        status: result.status,
        training_order_name: result.training_order_name,
        training_topics: result.training_topics, 
        training_feedbacks: result.training_feedbacks,
        training_participants: result.training_participants.map(data => Object.assign({}, 
          {
            id: data.id,
            name: data.employee.first_name + " " + data.employee.middle_name + " " + data.employee.last_name,
            designation: data.designation.name,
            grade: data.grade.name,
            project: data.project.name,
            emp_code: data.emp_code,
            training_info_id: data.training_info_id,
            present: data.present
          }
        ))
      }
    )) 

    let data = {
      rows: training,
      count: results.count
    }
    res.status(200).json(data) 
  })
  .catch(err=>{
    console.log(err)
    res.status(500).json({message:'Opps! Some error happened!!'})
  })  
})

router.route('/')
.post((req, res)=>{
  trainingInfo
    .build({
      course_title: req.body.course_title,
      from_date: req.body.from_date,
      to_date: req.body.to_date,
      venue: req.body.venue,
      objective: req.body.objective,
      training_type: req.body.training_type,
      training_institute_id: req.body.training_institute_id ? req.body.training_institute_id : null,
      status: codes.TRAINING_CREATED,
      project_id: req.user.project_id
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
.put((req, res)=>{
  console.log(req.body)
  trainingInfo.update({ 
      course_title: req.body.course_title,
      from_date: req.body.from_date,
      to_date: req.body.to_date,
      venue: req.body.venue,
      objective: req.body.objective,
      training_type: req.body.training_type,
      training_institute_id: req.body.training_institute_id ? req.body.training_institute_id : null,
      project_id: req.user.project_id
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

router.route('/:id/publish')
.put((req, res) => {
  trainingInfo.update({ status: codes.TRAINING_PUBLISHED },
    { where: {id: req.params.id }
  })
  .then(() => {
    res.status(200).json({ message:'Successfully published the training' })
  })
  .catch(err=>{
    console.log(err)
    res.status(500).json({ message:'Opps! Some error happened!!', error: err })
  })
})

router.route('/:id/mark-complete')
.put((req, res) => {
  trainingInfo.update({ status: codes.TRAINING_COMPLETED },
    { where: {id: req.params.id }
  })
  .then(() => {
    res.status(200).json({ message:'Successfully marked the training as completed' })
  })
  .catch(err=>{
    console.log(err)
    res.status(500).json({ message:'Opps! Some error happened!!', error: err })
  })
})

module.exports = router