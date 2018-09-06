
const router = require('express').Router({mergeParams:true})
const holidayModel = require('../../model/holiday.model')

router.route('/calendar')
.get((req, res) => {
    holidayModel.findAll({order: [
        ['day', 'ASC']
    ]})
    .then(result=>res.status(200).json(result))
    .catch(err=>{
        console.log(err)
        res.status(500).json({message:'Opps! Some error happened!!'})
    })
})

router.route('/')
.get((req,res)=>{
    let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0
    let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50
    let offset = pageIndex * limit

    holidayModel.findAndCountAll({ 
        where: { project_id: req.params.id },
        order: [['day', 'DESC']],
        limit: parseInt(req.query.pageSize),
        offset: offset
    })
    .then(result=>res.status(200).json(result))
    .catch(err=>{
        console.log(err)
        res.status(500).json({message:'Opps! Some error happened!!'})
    }
    )
})
.post((req,res)=>{
    holidayModel
    .build({
        name: req.body.name,
        day: req.body.day,
        type: req.body.type,
        project_id: req.params.id
       
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
.delete((req,res)=>{
    holidayModel.destroy({where: {project_id: req.params.id}})
    .then(result=>res.status(200).json(result))
    .catch(err=>{
        console.log(err)
        res.status(500).json({message:'Opps! Some error happened!!'})
    }
    )
})
router.route('/:holiday')
.delete((req,res)=>{
    holidayModel.destroy({where: {id:req.params.holiday,project_id: req.params.id}})
    .then(result=>res.status(200).json(result))
    .catch(err=>{
        console.log(err)
        res.status(500).json({message:'Opps! Some error happened!!'})
    }
    )
})
.get((req,res)=>{
    holidayModel.findAll({where: {id:req.params.holiday,project_id: req.params.id}})
    .then(result=>res.status(200).json(result))
    .catch(err=>{
        console.log(err)
        res.status(500).json({message:'Opps! Some error happened!!'})
    }
    )
})

router.route('/:holiday')
.put((req,res)=>{
    holidayModel.update({name:req.body.name,day:req.body.day,type:req.body.type},
        {where: {id:req.params.holiday,project_id: req.params.id}})
    .then(() => {
        holidayModel.findById(req.params.holiday)
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

module.exports = router