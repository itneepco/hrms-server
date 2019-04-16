const router = require('express').Router()
const employeeModel = require('../../model/employee.model')
const projectModel = require('../../model/project.model')
const designationModel = require('../../model/designation.model')
const gradeModel = require('../../model/grade.model')
const Op = require('sequelize').Op

router.route('/search/')
	.get((req, res) => {
		let user = req.user
		let condition = {}
    
    if(req.query.emp_code && req.query.emp_code.length > 0) {
      condition = {
				emp_code: { [Op.like]: "%" + req.query.emp_code + "%" }
			}
    }

    if(req.query.name && req.query.name.length > 0) {
      condition = {
        [Op.or]: [{
          first_name: {
            [Op.like]: "%" + req.query.name + "%"
          }
        },
        {
          middle_name: {
            [Op.like]: "%" + req.query.name + "%"
          }
        },
        {
          last_name: {
            [Op.like]: "%" + req.query.name + "%"
          }
        }]
      }
    }

		//If current user is not IT admin or HR Admin, the specify project id
		if (!(user.role == 1 || user.role == 2)) {
			condition["project_id"] = user.project_id
		}

		employeeModel.findAll({
      order: [['first_name', 'ASC']],
			where: condition,
			include: [
				{ model: projectModel },
        { model: designationModel },
        { model: gradeModel }
			]
		})
		.then(results => {
			if (!results) return res.status(200).json(null)

			let data = results.map(emp => Object.assign(
				{},
				{
					id: emp.id,
					emp_code: emp.emp_code,
					first_name: emp.first_name,
					middle_name: emp.middle_name,
					last_name: emp.last_name,
					project: emp.project.name,
          designation: emp.designation.name,
          grade: emp.grade.name,
				})
			)

			res.status(200).json(data)
		})
		.catch(error => {
			console.log(error)
			res.status(500).json({ message: 'An error occured' })
		})
	})

router.route('/:empCode')
	.get((req, res) => {
		let user = req.user
		let condition = { emp_code: req.params.empCode }

		//If current user is not IT admin or HR Admin, the specify project id
		if (!(user.role == 1 || user.role == 2)) {
			condition["project_id"] = user.project_id
		}

		employeeModel.findOne({
			where: condition,
			include: [
				{ model: projectModel },
				{ model: designationModel }
			]
		})
		.then(emp => {
			if (!emp) return res.status(200).json(null)
			let result = Object.assign({}, {
				id: emp.id,
				emp_code: emp.emp_code,
				first_name: emp.first_name,
				middle_name: emp.middle_name,
				last_name: emp.last_name,
				project: emp.project.name,
				designation: emp.designation.name
			})

			res.status(200).json(result)
		})
		.catch(error => {
			console.log(error)
			res.status(500).json({ message: 'An error occured' })
		})
	})

module.exports = router