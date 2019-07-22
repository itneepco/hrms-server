const router = require('express').Router({mergeParams: true})
const db = require('../../../config/db')
const employeeGroups = require('../../../model/attendance/employeeGroup.model')
const Employee = require('../../../model/shared/employee.model')
const designation = require('../../../model/shared/designation.model')
const getEmployeeDetail = require('../shared/functions/getEmployeeDetail')
const getEmpGroup = require('../../api/shared/functions/getEmpGroup')
const Sequelize = require('sequelize')

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
        id: result.id, 
        group_id: result.group_id,
        employee: {
          emp_code: result.employee.emp_code,
          first_name: result.employee.first_name,
          middle_name: result.employee.middle_name,
          last_name: result.employee.last_name,
          designation: result.employee.designation.name
        }
       }
     ))
      res.status(200).json(empGroup)     
    })
    .catch(Sequelize.UniqueConstraintError,() =>{
      console.log(err)
      res.status(500).json({ message: "Employee ID alreday mapped to a group" })
    })
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: "Opps! Some error occured!!" })
    })
})
.post((req,res) =>{
  employeeGroups.upsert({
    emp_code: req.body.emp_code,
    group_id: req.params.groupId   
  })
  
  .then(async(result)=>{
    let empGroup = await getEmpGroup(req.body.emp_code)
    let employee = await getEmployeeDetail(req.body.emp_code)
    data = Object.assign({},{
        id: empGroup.id,      
        group_id: req.params.groupId,
				employee: employee				
    })
    res.status(200).send(data)
  })
  .catch(err=>{
    console.log(err)
    res.status(500).json('Oops! some error occured!!')
  })
})

router.route('/:id')
.get((req,res)=>{
  employeeGroups.findById(req.params.id)
  .then(async(result)=>{
    
    let employee = await getEmployeeDetail(req.body.emp_code)
    data = Object.assign({},{
        id: req.params.id,
        group_id: req.params.groupId,
				employee: employee				
    }) 
    res.status(200).send(data)
  })
  .catch(err=>{
    console.log(err)
    res.status(500).json('Oops! some error occured!!')
  })
})

.put((req,res)=>{
  employeeGroups.update(
    {
      emp_code: req.body.emp_code,
      group_id: req.params.groupId 
    },
    {
      returning : true,
      where: {id:req.params.id}
    })
    .then(async(result)=>{
      console.log(result)
      let employee = await getEmployeeDetail(req.body.emp_code)
      data = Object.assign({},{
          id: req.params.id,
          group_id: req.params.groupId,
          employee: employee				
      })
      res.status(200).send(data)
    })
    .catch(err=>{
      console.log(err)
      res.status(500).json('Oops! some error occured!!')
    })
})

.delete((req,res)=>{
  employeeGroups.destroy({where: {id:req.params.id}})
  .then(result=>res.status(200).json(result))
  .catch(err=>{
      console.log(err)
      res.status(500).json({message:'Opps! Some error happened!!'})
  }
  )
})



module.exports = router