const router = require('express').Router()
const payImageModel = require('../../../model/shared/payImage.model')
const payCode = require('../../../model/shared/payCodes.model')
const employeeModel = require('../../../model/shared/employee.model')
const projectModel = require('../../../model/shared/project.model')
const designationModel = require('../../../model/shared/designation.model')

router.route('/:empCode')
.get(async(req,res)=>{
    let today = new Date()
    let year = today.getFullYear().toString()
    
    //Get previous month. If current month is January make it previous year December
    let curr_month = today.getMonth()
    if(curr_month == 0) {
      curr_month = 12
      year = year - 1
    }

    let month  = curr_month > 9 ?  curr_month.toString() : '0' + curr_month.toString()
    let yymm = req.query.yymm ? req.query.yymm : (year + month)
    
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

        let payments = results.filter(result =>  ((result.pay_mode == 1 ) && !(result.pay_code == 997 || result.pay_code == 999)));       

        let arrearPayments =  results.filter(result => result.pay_mode ==2);
        
        let pdata = payments.map(result => Object.assign({},{
            pay_code: result.pay_code,
            pay_code_desc: result.payCode.pay_code_desc,
            pay_code_srl: result. pay_code_srl,
            pay_mode: result.pay_mode,
            txn_amt: result.txn_amt
        }));

        let arrearPaymentData = arrearPayments.map(result => Object.assign({},{
            pay_code: result.pay_code,
            pay_code_desc: result.payCode.pay_code_desc +" ARREAR",
            pay_code_srl: result. pay_code_srl,
            pay_mode: result.pay_mode,
            txn_amt: result.txn_amt
        }));

        const arrearData = arrearPaymentData.reduce((a,b) => {           
            let found = a.find(e => e.pay_code == b.pay_code)
            if (found) found.txn_amt += b.txn_amt;
            else a.push(b);
            return a;
         },[]);       
        
        let grossPay = results.filter(result=> result.pay_code == 997).map(result => Object.assign({},{
            pay_code: result.pay_code,
            pay_code_desc: result.payCode.pay_code_desc,
            pay_code_srl: result. pay_code_srl,
            pay_mode: result.pay_mode,
            txn_amt: result.txn_amt
        }))

        let netPay = results.filter(result=> result.pay_code == 999).map(result => Object.assign({},{
            pay_code: result.pay_code,
            pay_code_desc: result.payCode.pay_code_desc,
            pay_code_srl: result. pay_code_srl,
            pay_mode: result.pay_mode,
            txn_amt: result.txn_amt
        }))

        let deductions = results.filter(result=> ((result.pay_mode == 4 ) && result.pay_code != 998))   
        let arrearDeductions = results.filter(result=> (( result.pay_mode == 5) && result.pay_code != 998))       
        let ddata = deductions.map(result => Object.assign({},{
            pay_code: result.pay_code,
            pay_code_desc: result.payCode.pay_code_desc,
            pay_code_srl: result. pay_code_srl,
            pay_mode: result.pay_mode,
            txn_amt: result.txn_amt
        }));
        let deductionArrears = arrearDeductions.map(result => Object.assign({},{
            pay_code: result.pay_code,
            pay_code_desc: result.payCode.pay_code_desc + " ARREAR",
            pay_code_srl: result. pay_code_srl,
            pay_mode: result.pay_mode,
            txn_amt: result.txn_amt
        }));

        const dArrearData = deductionArrears.reduce((a,b) => {           
            let found = a.find(e => e.pay_code == b.pay_code)
            if (found) found.txn_amt += b.txn_amt;
            else a.push(b);
            return a;
         },[]);    

        let grossDeduction = results.filter(result=> result.pay_code == 998).map(result => Object.assign({},{
            pay_code: result.pay_code,
            pay_code_desc: result.payCode.pay_code_desc,
            pay_code_srl: result. pay_code_srl,
            pay_mode: result.pay_mode,
            txn_amt: result.txn_amt
        }))

        res.status(200).json({
            employee: employee,
            payments: pdata.concat(arrearData),
            deductions:ddata.concat(dArrearData),
            grossPay: grossPay[0],
            netPay: netPay[0],
            grossDeduction: grossDeduction[0],
            yymm: yymm
        })
    })
    .catch(error=>{
        console.log(error)
        res.status(500).json({message : 'An error occured'})
    })
      
})
module.exports = router