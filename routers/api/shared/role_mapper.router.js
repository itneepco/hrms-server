const router = require('express').Router()
const roleMapperModel = require('../../../model/shared/roleMapper.model')
const EmployeeModel = require('../../../model/shared/employee.model')
const ProjectModel = require('../../../model/shared/project.model')
const Op = require('sequelize').Op

router.route('/role/:roleId')
.get((req,res)=>{
  roleMapperModel.findAll({
    where: { 
      role: req.params.roleId,
      project_id: {
        [Op.like]: req.query.project_id ? "%"+req.query.project_id : '%' 
      }
    },
    include : [
      {
        model: EmployeeModel,
        as: "admin",
        attributes: ['emp_code', 'first_name', 'last_name'],
      },
      {
        model:ProjectModel,
        as:"project"
      }
    ]
  })
  .then(results => {     
    if(!results) return res.status(200).json(null)

    console.log("RESULT", results)
    let roles = results.map(result => {
      return Object.assign({}, {
        id : result.id,
        role:result.role,
        emp_code : result.emp_code,         
        first_name : result.admin.first_name,          
        last_name: result.admin.last_name,
        project_id: result.project.id,
        project_name: result.project.name
        
      })
    })
    res.status(200).json(roles)
  })
  .catch(error=>{
      console.log(error)
      res.status(500).json({message : 'An error occured'})
  })   
})

router.route('/')
.get((req,res)=>{
    let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0
    let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50
    let offset = pageIndex * limit

    roleMapperModel.findAndCountAll({
      limit: limit,
      offset: offset,
      distinct: true,
      order: ['project_id', 'role'],
      include : [
        {
          model: EmployeeModel,
          as: "admin",
          attributes: ['emp_code', 'first_name', 'last_name'],
        },
        {
          model:ProjectModel,
          as:"project"
        }
      ]
    })
    .then(results => {     
      if(!results) return res.status(200).json(null)

      // console.log("RESULT", results)
      let roles = results.rows.map(result => {
        return Object.assign({},{
          id : result.id,
          role:result.role,
          emp_code : result.emp_code,         
          first_name : result.admin.first_name,          
          last_name: result.admin.last_name,
          project_id: result.project.id,
          project_name: result.project.name
         
        })
      })

      let data = {
        rows: roles,
        count: results.count
      }
      res.status(200).json(data)
    })
    .catch(error=>{
        console.log(error)
        res.status(500).json({message : 'An error occured'})
    })   
})

.post((req, res) => {
  roleMapperModel
    .create({
      role: req.body.role,
      emp_code: req.body.emp_code,
      project_id: req.body.project_id
    })
    .then(result => {
      roleMapperModel.findById(result.id, {
        include : [
          {
            model: EmployeeModel,
            as: "admin",
            attributes: ['emp_code', 'first_name', 'last_name'],
          },
          {
            model:ProjectModel,
            as:"project"
          }
        ]
      })
      .then(result=> {
        let data = Object.assign({}, {
          id : result.id,
          role:result.role,
          emp_code : result.emp_code,         
          first_name : result.admin.first_name,          
          last_name: result.admin.last_name,
          project_id: result.project.id,
          project_name: result.project.name
          
        })
        res.status(200).json(data) 
      })
      .catch(err =>{
        console.log(err) 
        res.status(500).json({message:'Opps! Some error happened!!'})
      })
    })
    .catch(error => {
      console.log(error)
      res.status(500).json('Oops! An error occured')
    })
})

 router.route('/:id')
.delete((req,res)=>{
    roleMapperModel.destroy(
      {where:{id:req.params.id}}
    )
    .then(result=>{     

        res.status(200).json(result)
    })
    .catch(error=>{
        console.log(error)
        res.status(500).json({message : 'An error occured'})
    })   
})
.put((req,res)=>{
  roleMapperModel.update({
    role: req.body.role,
    emp_code: req.body.emp_code,
    project_id: req.body.project_id
  },  
  {where: { id: req.params.id }})
  .then(() => {
    roleMapperModel.findById(req.params.id, {
      include : [
        {
          model: EmployeeModel,
          as: "admin",
          attributes: ['emp_code', 'first_name', 'last_name'],
        },
        {
          model:ProjectModel,
          as:"project"
        }
      ]
    })
    .then(result=> {
      let data = Object.assign({}, {
        id : result.id,
        role:result.role,
        emp_code : result.emp_code,         
        first_name : result.admin.first_name,          
        last_name: result.admin.last_name,
        project_id: result.project.id,
        project_name: result.project.name
        
      })
      res.status(200).json(data) 
    })
    .catch(err =>{
      console.log(err) 
      res.status(500).json({message:'Opps! Some error happened!!'})
    })
  })
  .catch(err=>{
    console.log(err)
    res.status(500).json({message:'Opps! Some error happened!!'})
  })
})

module.exports = router
