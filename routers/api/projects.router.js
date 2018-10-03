
const router = require('express').Router()
const ProjectModel = require('../../model/project.model')
const HolidayModel = require('../../model/holiday.model')
const validateAdmin = require('../../middlewares/validateAdmin')

router.get('/',(req,res)=>{
    ProjectModel.findAll({order: [
        ['name', 'ASC']
    ]})
     .then(result=>res.status(200).json(result))
     .catch(err=>{
         console.log(err)
         res.status(500).json({message:'Opps! Some error happened!!'})
     })
})

router.get('/:id',(req,res)=>{
    ProjectModel.findById(req.params.id)
     .then(result=>res.status(200).json(result))
     .catch(err=>{
         console.log(err)
         res.status(500).json({message:'Opps! Some error happened!!'})
     })
})

router.route('/:id/calendar')
.get((req, res) => {
    HolidayModel.findAll({
        where: { project_id: req.params.id },
        order: [['day', 'ASC']]
    })
    .then(result=>res.status(200).json(result))
    .catch(err=>{
        console.log(err)
        res.status(500).json({message:'Opps! Some error happened!!'})
    })
})

router.use('/:id/holidays', require('./holiday.router'))

module.exports = router