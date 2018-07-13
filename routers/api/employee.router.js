const router = require('express').Router()
const employeeModel = require('../../model/employee.model')
const projectModel = require('../../model/project.model')
const designationModel = require('../../model/designation.model')

router.route('/hierarchy/:empCode')
.get((req,res)=>{
    employeeModel.findOne({
        where: {emp_code: req.params.empCode},
        include:[{model:projectModel},{model:designationModel}
        ]
    })
    .then(emp=>{
        if(!emp) return res.status(200).json(null)
        let result = Object.assign({},{
            id : emp.id,
            emp_code : emp.emp_code,
            first_name : emp.first_name,
            middle_name : emp.middle_name,
            last_name: emp.last_name,
            project: emp.project.name,
            designation:emp.designation.name
        })

        res.status(200).json(result)
    })
    .catch(error=>{
        console.log(error)
        res.status(500).json({message : 'An error occured'})
    })
      
})
module.exports = router