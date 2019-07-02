const router = require('express').Router({mergeParams: true})
const db = require('../../../config/db')
const employeeGroups = require('../../../model/attendance/employeeGroup.model')
const Employee = require('../../../model/shared/employee.model')
const designation = require('../../../model/shared/designation.model')

router.route('/')
.get((req, res) => {
 
  employeeGroups.findAll({
      include :[
        {
           model:Employee,as:'employee',
           include:[{ model: designation }]
        }
      ],
      where: { group_id: req.params.groupId}
  })

    .then(results =>{
       let empGroup = results.map(result=>Object.assign({},{
        group_id: result.group_id,
        employee: {
          emp_code: result.employee.emp_code,
          first_name: result.employee.first_name,
          last_name: result.employee.last_name,
          designation: result.employee.designation.name
        }
       }
     ))
      res.status(200).json(empGroup)     
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: "Opps! Some error occured!!" })
    })
})
.post((req,res) =>{
  employeeGroups.build({
    emp_code: req.body.emp_code,
    group_id: req.params.groupId   
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



module.exports = router