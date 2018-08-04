
const router = require('express').Router()
const ledgerModel = require('../../model/leaveLedger.model')

router.route('/ledger/:id')
.get((req,res)=>{

    ledgerModel.findById(req.params.id)
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
        ledgerModel.findById(req.params.id)
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

router.route('/ledger/:emp_code')
.get((req,res)=>{
    ledgerModel.findAll({where:{emp_code:req.params.emp_code}})
    .then(result=>{
        res.status(200).json(result)
    })
    .catch(err=>{
        console.log(err)
        res.status(500).json({message:'Oops! Some error happend'})
    })

})

.post((req,res)=>{

    ledgerModel.build(
        {
            emp_code: req.params.emp_code,
            cal_year: req.body.cal_year,
            db_cr_flag: req.body.db_cr_flag,
            no_of_days: req.body.no_of_days,
            leave_type_id: req.body.leave_type_id,
            remarks: req.body.remarks
        })
        .save()
        .then(result=>{
            console.log(result)
            res.status(200).send(result)
        })
        .catch(err=>{
            console.log(err)
            res.status(500).json({message:'Opps! Some error occured!!'})
        })
})

module.exports = router