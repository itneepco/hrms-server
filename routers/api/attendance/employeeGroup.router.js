const router = require('express').Router({ mergeParams: true })
const Op = require("sequelize").Op;

const employeeGroups = require('../../../model/attendance/employeeGroup.model')
const Employee = require('../../../model/shared/employee.model')
const designation = require('../../../model/shared/designation.model')
const getEmployeeDetail = require('../shared/functions/getEmployeeDetail')
const getEmpGroup = require('../shared/functions/getEmpGroup')
const groupModel = require('../../../model/attendance/group.model')
const employeeModel = require('../../../model/shared/employee.model')

router.route('/exempted-list')
  .get(async (req, res) => {
    try {
      const groups = await groupModel.findAll({
        where: { project_id: req.params.projectId }
      })
      const groupIds = groups.map(group => group.id)
      const empGroups = await employeeGroups.findAll({
        where: {
          group_id: { [Op.in]: groupIds }
        }
      })
      const empCodes = empGroups.map(empGroup => empGroup.emp_code)

      const employees = await employeeModel.findAll({
        attributes: ['emp_code', 'first_name', 'middle_name', 'last_name'],
        where: {
          emp_code: {
            [Op.notIn]: empCodes
          },
          project_id: req.params.projectId
        },
        order: [['first_name', 'ASC']], 
        include: [{ model: designation }]
      })

      const result = employees.map(employee => {
        return {
          emp_code: employee.emp_code,
          first_name: employee.first_name,
          middle_name: employee.middle_name,
          last_name: employee.last_name,
          designation: employee.designation.name
        }
      })
      
      res.status(200).json(result)
    }
    catch (err) {
      console.log(err);
      res.status(500).json({ message: "Opps! Some error occured!!" })
    }
  })

router.route('/group/:groupId')
  .get((req, res) => {
    employeeGroups.findAll({
      include: [
        {
          model: Employee, as: 'employee',
          include: [{ model: designation }]
        }
      ],
      where: { group_id: req.params.groupId }
    })
    .then(results => {
      let empGroup = results.map(result => Object.assign({}, {
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
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: "Opps! Some error occured!!" })
    })
  })

router.route('/new')  
  .post((req, res) => {
    employeeGroups.upsert({
      emp_code: req.body.emp_code,
      group_id: req.body.group_id
    })
    .then(async (result) => {
      let empGroup = await getEmpGroup(req.body.emp_code)
      let employee = await getEmployeeDetail(req.body.emp_code)
      data = Object.assign({}, {
        id: empGroup.id,
        group_id: empGroup.group_id,
        employee: employee
      })
      res.status(200).send(data)
    })
    .catch(err => {
      console.log(err)
      res.status(500).json('Oops! some error occured!!')
    })
  })

router.route('/:id')
  .get((req, res) => {
    employeeGroups.findById(req.params.id)
      .then(async (result) => {

        let employee = await getEmployeeDetail(req.body.emp_code)
        data = Object.assign({}, {
          id: result.id,
          group_id: result.group_id,
          employee: employee
        })
        res.status(200).send(data)
      })
      .catch(err => {
        console.log(err)
        res.status(500).json('Oops! some error occured!!')
      })
  })

  .put((req, res) => {
    const emp_code = req.body.emp_code
    const group_id = req.body.group_id

    employeeGroups.update(
      {
        emp_code,
        group_id 
      },
      {
        returning: true,
        where: { id: req.params.id }
      })
      .then(async (result) => {
        console.log(result)
        let employee = await getEmployeeDetail(req.body.emp_code)
        data = Object.assign({}, {
          id: req.params.id,
          group_id: group_id,
          employee: employee
        })
        res.status(200).send(data)
      })
      .catch(err => {
        console.log(err)
        res.status(500).json('Oops! some error occured!!')
      })
  })

  .delete((req, res) => {
    employeeGroups.destroy({ where: { id: req.params.id } })
      .then(result => res.status(200).json(result))
      .catch(err => {
        console.log(err)
        res.status(500).json({ message: 'Opps! Some error happened!!' })
      })
  })

module.exports = router