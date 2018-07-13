const router = require('express').Router()
const hierarchyModel = require('../../model/hierarchy.model')
const employeeModel = require('../../model/employee.model')
const designationModel = require('../../model/designation.model')
const projectModel = require('../../model/project.model')

router.route('/:empCode')
	.get((req, res) => {
		hierarchyModel.findOne({
			where: { emp_code: req.params.empCode },
			include: [
				{
					model: hierarchyModel,
					as: "children",
					include: [
						{
							model: employeeModel,
							include: [
								{ model: designationModel },
								{ model: projectModel }
							]
						}
					]
				},
				{
					model: employeeModel,
					include: [
						{ model: designationModel },
						{ model: projectModel }
					]
				},
				{
					model: employeeModel,
					as: "parent",
					include: [
						{ model: designationModel },
						{ model: projectModel }
					]
				} 
			]
		})
			.then(emp => {
				if(!emp) return res.status(200).json(null)

				let parent
				if(emp && emp.parent) {
					parent = {
						emp_code: emp.parent.emp_code,
						first_name: emp.parent.first_name,
						middle_name: emp.parent.middle_name,
						last_name: emp.parent.last_name,
						project:emp.parent.project.name,
						designation: emp.parent.designation.name,
					}
				} else {
					parent = null
				}
				let result = Object.assign(
					{},
					{
						id: emp.id,
						emp_code: emp.emp_code,
						first_name: emp.employee.first_name,
						middle_name: emp.employee.middle_name,
						last_name: emp.employee.last_name,
						project:emp.employee.project.name,
						designation: emp.employee.designation.name,
						parent: parent,
						children: emp.children.map(empl => {
							 return Object.assign({},
							  {
								emp_code: empl.employee.emp_code,
								first_name: empl.employee.first_name,
								middle_name: empl.employee.middle_name,
								last_name: empl.employee.last_name,
								project: empl.employee.project.name,
								designation: empl.employee.designation.name
							  }
							)
						})
					}
				)
				res.status(200).json(result)
			})
	})

module.exports = router