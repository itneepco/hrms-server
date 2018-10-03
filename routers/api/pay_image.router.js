const router = require('express').Router()
const payImageModel = require('../../model/payImage.model')
const payCode = require('../../model/payCodes.model')
const employeeModel = require('../../model/employee.model')
const projectModel = require('../../model/project.model')
const designationModel = require('../../model/designation.model')

router.route('/:empCode')
.get(async(req,res)=>{
    let today = new Date()
    let year = today.getFullYear().toString()
    let mon  = today.getMonth() > 9 ?  today.getMonth().toString() : '0' + today.getMonth().toString()
    let yymm = req.query.yymm ? req.query.yymm : (year+mon)

    let employee = await employeeModel.findOne({
        where: {emp_code: req.params.empCode},
        include:[{model:projectModel},{model:designationModel}
        ]
    })
    .then(emp=>{
        if(!emp) return res.status(200).json(null)
        let result = Object.assign({}, {
            id : emp.id,
            emp_code : emp.emp_code,
            first_name : emp.first_name,
            middle_name : emp.middle_name,
            last_name: emp.last_name,
            project: emp.project.name,
            designation:emp.designation.name
        })
      return result
    })

    payImageModel.findAll({
        where: {emp_num: req.params.empCode, yymm: yymm},
        include:[{model: payCode, as: "payCode"}]
    })
    .then(results=>{
        if(!results) return res.status(200).json({message:'data not found'})

        let payments = results.filter(result=>result.pay_mode == 1|| result.pay_mode ==2)
        let deductions = results.filter(result=>result.pay_mode == 4|| result.pay_mode ==5)
        let pdata = payments.map(result => Object.assign({},{
            emp_code: result.emp_num,
            yymm : result.yymm,
            pay_code: result.pay_code,
            pay_code_desc: result.payCode.pay_code_desc,
            pay_code_srl: result. pay_code_srl,
            pay_mode: result.pay_mode,
            txn_amt: result.txn_amt
        }))

        let ddata = deductions.map(result => Object.assign({},{
            emp_code: result.emp_num,
            yymm : result.yymm,
            pay_code: result.pay_code,
            pay_code_desc: result.payCode.pay_code_desc,
            pay_code_srl: result. pay_code_srl,
            pay_mode: result.pay_mode,
            txn_amt: result.txn_amt
        }))

        res.status(200).json({
            employee: employee,
            payments: pdata,
            deductions:ddata
        })
    })
    .catch(error=>{
        console.log(error)
        res.status(500).json({message : 'An error occured'})
    })
      
})
module.exports = router