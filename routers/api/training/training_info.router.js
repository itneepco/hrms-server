const router = require('express').Router()
const path = require('path');
const Op = require('sequelize').Op;
const codes = require('../../../global/codes')

const multer  = require('multer')
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, codes.TRAINING_DIRECTORY)
  },
  filename: function (req, file, cb) {
    let name = req.params.id ? req.params.id + '.pdf' : file.originalname
    cb(null, name)
  }
})
const upload = multer({ 
  storage: storage,
  fileFilter: function (req, file, cb) {
    console.log(file.mimetype)
    if (file.mimetype != 'application/pdf') {
      return cb(new Error('Only pdfs are allowed'))
    }
    cb(null, true)
  } 
}).single('order')

const trainingInfo = require('../../../model/training/trainingInfo.model')
const trainingInstitute = require('../../../model/training/trainingInstitute.model')
const trainingTopic = require('../../../model/training/trainingTopic.model')
const trainingParticipant = require('../../../model/training/trainingParticipant.model')
const projectModel = require('../../../model/project.model')
const gradeModel = require('../../../model/grade.model')
const designationModel = require('../../../model/designation.model')
const employeeModel = require('../../../model/employee.model')
const trainingFeedback = require('../../../model/training/trainingFeedback.model')
const topicRating = require('../../../model/training/trainingTopicRating.model')

router.route('/employee/:empCode')
.get((req, res)=>{
  let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0
  let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50
  let offset = pageIndex * limit

  trainingInfo.findAndCountAll({ 
    distinct: true,
    order: [['from_date', 'DESC']],
    limit: limit,
    offset: offset,
    attributes: { exclude: ['training_institute_id'] },
    include: [
      { model: trainingInstitute },
      { model: trainingFeedback },
      { 
        model: trainingTopic, 
        include: [ { model: topicRating } ]
      },
      { 
        model: trainingParticipant,
        include: [
          { model: projectModel },
          { model: designationModel },
          { model: gradeModel },
          { model: employeeModel }
        ] ,
        where: { emp_code: req.params.empCode }
      }
    ]
  })
  .then(results => { 
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
        training_order_name: codes.TRAINING_DIRECTORY + result.training_order_name,
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
        )),
        //Feedback of the current employee
        training_feedbacks: result.training_feedbacks.filter(data => data.emp_code == req.params.empCode),
        //Rating of the current employee on the performance of the training faculty
        training_topics: result.training_topics.map(data => { 
          let topicRating = data.training_topic_ratings.find(rating => rating.emp_code == req.params.empCode)
          return Object.assign({}, {
            id: data.id,
            training_info_id: data.training_info_id,
            faculty_name: data.faculty_name,
            topic_name: data.topic_name,
            rating: topicRating ? topicRating.rating : null,
            emp_code: topicRating ? topicRating.emp_code : null,
          })
        }),
      }
    )) 
    res.status(200).json({
      rows: training,
      count: results.count
    }) 
  })
  .catch(err=>{
    console.log(err)
    res.status(500).json({message:'Opps! Some error happened!!'})
  })  
})

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
    order: [['from_date', 'DESC']],
    limit: limit,
    offset: offset,
    where: condition,
    include: [
      { model: trainingFeedback },
      { 
        model: trainingTopic, 
        include: [ { model: topicRating } ]
      },
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
        training_institute_id: result.training_institute_id, 
        status: result.status,
        training_order_name: codes.TRAINING_DIRECTORY + result.training_order_name,
        //All feedbacks from the participants
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
        )),
        //Average rating on the performance of the training faculty
        training_topics: result.training_topics.map(data => { 
          let avg_rating = 0
          data.training_topic_ratings.forEach(rating => avg_rating += rating.rating)
          return Object.assign({}, {
            id: data.id,
            training_info_id: data.training_info_id,
            faculty_name: data.faculty_name,
            topic_name: data.topic_name,
            avg_rating: avg_rating,
          })
        }), 
      }
    )) 
    res.status(200).json({
      rows: training,
      count: results.count
    }) 
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
    .catch(err => {
      console.log(err)
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

router.post('/:id/upload-order', (req, res) => {
  upload(req, res, (err) => {
    if(err) {
      return res.status(500).json({ message: 'Only PDFs are allowed', error: err })
    } 

    trainingInfo.update({ training_order_name: req.file.filename },
      { where: {id: req.params.id }
    })
    .then(() => {
      res.status(200).json({ message:'Successfully uploaded the training order' })
    })
    .catch(err=>{
      console.log(err)
      res.status(500).json({ message:'Opps! Some error happened!!', error: err })
    })
  })
})

router.get('/:id/download-order', (req, res) => {
  trainingInfo.findById(req.params.id)
  .then(training => {
    let path = codes.TRAINING_DIRECTORY + training.training_order_name
    console.log(path)
    res.download(path)
  })
  .catch(err=>{
    console.log(err)
    res.status(500).json({ message:'Cannot find training with that id', error: err })
  })
})

module.exports = router