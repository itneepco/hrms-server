const router = require('express').Router()
const Op = require('sequelize').Op
const db = require('../../../config/db')
const labelModel = require('../../../model/training/trainingLabel.model')

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

const codes = require('../../../global/codes')

router.route('/my-training')
.get((req, res)=>{
  let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0
  let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50
  let offset = pageIndex * limit

  trainingInfo.findAndCountAll({ 
    distinct: true,
    order: [['from_date', 'DESC']],
    limit: limit,
    offset: offset,
    where: { 
      project_id: req.user.project_id, 
      status: {
        [Op.or]: [codes.TRAINING_PUBLISHED, codes.TRAINING_COMPLETED] 
      } 
    },
    include: [
      // { model: trainingFeedback },
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
      }, 
      {
        model: trainingParticipant,
        as: 'employee',
        where: { emp_code: req.user.emp_code },
      }
    ]
  })
  .then(results => { 
    filterData(req, res, results)
  })
  .catch(err=>{
    console.log(err)
    res.status(500).json({message:'Opps! Some error happened!!'})
  })  
})

router.route('/my-feedback')
.get((req, res) => {
  let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0
  let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50
  let offset = pageIndex * limit
  
  //Feedback pending for participants
  let condition = { emp_code: req.user.emp_code, present: true }
  if(req.query.status == 'pending') {
    condition['feedback_status'] = false 
  } else {
    condition['feedback_status'] = true
  }

  trainingInfo.findAndCountAll({ 
    distinct: true,
    order: [['from_date', 'DESC']],
    limit: limit,
    offset: offset,
    where: { status: codes.TRAINING_COMPLETED },
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
      }, 
      { model: trainingParticipant, as: 'employee', where: condition }
    ]
  })
  .then(results => { 
    console.log(results)
    filterData(req, res, results)
  })
  .catch(err=>{
    console.log(err)
    res.status(500).json({message:'Opps! Some error happened!!'})
  })  
})

function filterData(req, res, results) {
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
      training_order_name: result.training_order_name, 
      //Feedback of the current employee
      training_feedbacks: !result.training_feedbacks ? [] :
        result.training_feedbacks.filter(data => data.emp_code == req.user.emp_code),
      
      training_participants: result.training_participants.map(data => Object.assign({}, 
        {
          id: data.id,
          name: data.employee.first_name + " " + data.employee.middle_name + " " + data.employee.last_name,
          designation: data.designation.name,
          grade: data.grade.name,
          project: data.project.name,
          emp_code: data.emp_code,
          training_info_id: data.training_info_id
        }
      )),
      //Rating of the current employee on the performance of the training faculty
      training_topics: result.training_topics.map(data => { 
        let topicRating = data.training_topic_ratings.find(rating => rating.emp_code == req.user.emp_code)
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

  let data = {
    rows: training,
    count: results.count
  }
  res.status(200).json(data)
}

router.route('/training-label')
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

router.route('/training-institute/:id')
.get((req, res)=>{
  trainingInstitute.findById(req.params.id)
  .then(result => res.status(200).json(result))
  .catch(err => {
    console.log(err)
    res.status(500).json({ message:'Opps! Some error happened!!', error: err })
  })
})

module.exports = router