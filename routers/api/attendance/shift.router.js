const router = require('express').Router({mergeParams: true})

const shifts = require('../../../model/attendance/shift.model')

router.route('/')
.get((req, res) => {
  shifts
    .findAll({
      where: { project_id: req.params.projectId }
    })

    .then(result => res.status(200).json(result))
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: "Opps! Some error occured!!" })
    })
})
.post((req,res) =>{
  shifts.build({
    name: req.body.name,
    project_id: req.params.projectId,
    in_time_start: req.body.in_time_start,
    in_time_end: req.body.in_time_end,
    out_time_start: req.body.out_time_start,
    out_time_end:req.body.out_time_end,
    late_time: req.body.late_time,
    half_time: req.body.half_time,
    is_night_shift: req.body.is_night_shift,
    is_general: req.body.is_general,
    created_by: req.user.emp_code
  })
  .save()
  .then(result=>{
    console.log(result)
    res.status(200).send(result)
  })
  .catch(err=>{
    console.log(err)
    res.status(500).json('Oops! some error occured!!')
  })
})

router.route('/:id')
.get((req,res)=>{
  shifts.findById(req.params.id)
  .then(result=>res.status(200).json(result))
  .catch(err=>{
    console.log(err)
    res.status(500).json('Oops! some error occured')
  })
})
.put((req,res)=>{
  shifts.update(
    {
      name:req.body.name,
      in_time_start: req.body.in_time_start,
      in_time_end: req.body.in_time_end,
      out_time_start: req.body.out_time_start,
      out_time_end: req.body.out_time_end,
      late_time: req.body.late_time,
      half_time: req.body.half_time,
      is_night_shift: req.body.is_night_shift,
      is_general: req.body.is_general,
      created_by: req.body.created_by,
      updated_by: req.body.updated_by,
    },
      {where: {id:req.params.id}})
  .then(() => {
       shifts.findById(req.params.id)
      .then(result=>res.status(200).json(result))
      .catch(err =>{
          console.log(err) 
          res.status(500).json({message:'Opps! Some error happened!!'})
      })
  })
  .catch(err=>{
      console.log(err)
      res.status(500).json({message:'Opps! Some error happened!!'})
  }
  )
})
.delete((req,res)=>{
  shifts.destroy({where: {id:req.params.id}})
  .then(result=>res.status(200).json(result))
  .catch(err=>{
      console.log(err)
      res.status(500).json({message:'Opps! Some error happened!!'})
  }
  )
})


module.exports = router