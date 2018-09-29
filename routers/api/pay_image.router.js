const router = require('express').Router()
const payImageModel = require('../../model/payImage.model')

router.route('/:empCode/:yrmon')
.get((req,res)=>{
  payImageModel.find({
        where: {emp_code: req.params.empCode,yrmon:req.params.yrmon},
        
    })
    .then(result=>{
        if(!result) return res.status(200).json(null)
        let data = Object.assign({},{
            emp_num: data.emp_num,
            yymm : data.yymm,
            pay_code: data.pay_code,
            pay_code_srl:  data. pay_code_srl,
            pay_mode: data.pay_mode,
            txn_amt: data.txn_amt
        })

        res.status(200).json(data)
    })
    .catch(error=>{
        console.log(error)
        res.status(500).json({message : 'An error occured'})
    })
      
})
module.exports = router