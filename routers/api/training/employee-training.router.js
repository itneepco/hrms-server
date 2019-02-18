const router = require('express').Router()
const trainingInfo = require('../../../model/training/trainingInfo.model')
const trainingInstitute = require('../../../model/training/trainingInstitute.model')
const trainingTopic = require('../../../model/training/trainingTopic.model')
const trainingParticipant = require('../../../model/training/trainingParticipant.model')
const projectModel = require('../../../model/project.model')
const gradeModel = require('../../../model/grade.model')
const designationModel = require('../../../model/designation.model')
const employeeModel = require('../../../model/employee.model')

const codes = require('../../../global/codes')

router.route('/my-training')
.get((req, res)=>{
  let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0
  let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50
  let offset = pageIndex * limit

  trainingInfo.findAndCountAll({ 
    distinct: true,
    order: [['from_date', 'ASC']],
    limit: limit,
    offset: offset,
    attributes: { exclude: ['training_institute_id'] },
    where: { 
      project_id: req.user.project_id, 
      status: codes.TRAINING_PUBLISHED 
    },
    include: [
      { model: trainingInstitute },
      { model: trainingTopic },
      { 
        model: trainingParticipant,
        where: { emp_code: req.user.emp_code },
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

module.exports = router