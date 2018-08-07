
const router = require('express').Router()
const ledgerModel = require('../../model/leaveLedger.model')
const leaveTypeModel = require('../../model/leaveType.model')


router.get('/type',(req,res)=>{
    leaveTypeModel.findAll()
     .then(result=>res.status(200).json(result))
     .catch(err=>{
         console.log(err)
         res.status(500).json({message:'Opps! Some error happened!!'})
     })
})

router.route('/ledger')
.post((req,res)=>{

    ledgerModel.build(
        {
            emp_code: req.body.emp_code,
            cal_year: req.body.cal_year,
            db_cr_flag: req.body.db_cr_flag,
            no_of_days: req.body.no_of_days,
            leave_type_id: req.body.leave_type_id,
            remarks: req.body.remarks
        })
        .save()
        .then(result=>{
            console.log(result)
            //res.redirect('/ledger/:'+result.id)
            //res.status(200).send(result)
            findLedger(result.id,res)
        })
        .catch(err=>{
            console.log(err)
            res.status(500).json({message:'Opps! Some error occured!!'})
        })
})
router.route('/ledger/:id')
.get((req,res)=>{

    ledgerModel.findOne(
        {where:{id:req.params.id},
        include:[{model:leaveTypeModel}]
        })
    .then(result=>{
        res.status(200).json(result)
    })
    .catch(err=>{
        console.log(err)
        res.status(500).json({message:'Oops! Some error happend'})
    })
})



.delete((req,res)=>{

    ledgerModel.destroy({
        where:{id:req.params.id}
    })
    .then(result=>res.status(200).json(result))
    .catch(err=>{
        console.log(err)
        res.status(500).json({message:'Opps! Some error happened!!'})
    }
    )
})

.put((req,res)=>{
    ledgerModel.update(
        {
            emp_code: req.params.emp_code,
            cal_year: req.body.cal_year,
            db_cr_flag: req.body.db_cr_flag,
            no_of_days: req.body.no_of_days,
            leave_type_id: req.body.leave_type_id,
            remarks: req.body.remarks
        },
        {where: {id:req.params.id}})
    .then(() => {
        findLedger(req.params.id,res) 

       // ledgerModel.findById(req.params.id)
        //.then(result=>res.status(200).json(result))
       // .catch(err =>{
         //   console.log(err)
         //   res.status(500).json({message:'Opps! Some error happened!!'})
       // })
    })
    .catch(err=>{
        console.log(err)
        res.status(500).json({message:'Opps! Some error happened!!'})
    }
    )
})

router.route('/ledger/employee/:emp_code')
.get((req,res)=>{
    ledgerModel.findAll({
        where:{emp_code:req.params.emp_code},
        include:[{model:leaveTypeModel}]
    })
    .then(result=>{
        res.status(200).json(result)
    })
    .catch(err=>{
        console.log(err)
        res.status(500).json({message:'Oops! Some error happend'})
    })

})

function findLedger(lid,res){
    ledgerModel.findOne(
        {where:{id:lid},
        include:[{model:leaveTypeModel}]
        })
    .then(result=>{
        res.status(200).json(result)
    })
    .catch(err=>{
        console.log(err)
        res.status(500).json({message:'Oops! Some error happend'})
    })
}

module.exports = router