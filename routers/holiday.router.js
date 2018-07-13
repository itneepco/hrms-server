
const express = require('express')
const holidayModel = require('../model/holiday.model')

const HolidayRouter = express.Router()

HolidayRouter.route('/:project')
.get((req,res)=>{
    holidayModel.findAll({where: {project_id: req.params.project}})
    .then(result=>res.status(200).json(result))
    .catch(err=>{
        console.log(err)
        res.status(500).json({message:'Opps! Some error happened!!'})
    }
    )
})

HolidayRouter.route('/add')
.post((req,res)=>{
    holidayModel
    .build({
        name: req.body.name,
        day: req.body.day,
        type: req.body.type,
        project_id: req.body.project_id
       
    }) 
    .save()
    .then(result=>{
        console.log(result)
        res.status(200).send(result)
    })
    .catch(error=>{
        console.log(error)
        res.status(500).json('Oops! An error occured')
    })
})

module.exports = HolidayRouter