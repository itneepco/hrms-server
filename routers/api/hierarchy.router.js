

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
		.then(async (emp) => {
			if (!emp) {
				insertEmpNode(req.params.empCode).then(result => {
					res.status(200).json(result)
				})
			}
			else {
				let parent
				if (emp && emp.parent) {
					parent = {
						emp_code: emp.parent.emp_code,
						first_name: emp.parent.first_name,
						middle_name: emp.parent.middle_name,
						last_name: emp.parent.last_name,
						project: emp.parent.project.name,
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
						project: emp.employee.project.name,
						designation: emp.employee.designation.name,
						parent: parent,
						children: emp.children.map(empl => {
							return Object.assign({},
								{
									id: empl.id,
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
			}
		})
	})
	.post((req, res) => {
		hierarchyModel.findOne({ where: { emp_code: req.params.empCode } })
		.then(result => {
			if (!result) {
				hierarchyModel
					.build({
						emp_code: req.params.empCode,
						parent_emp_code: req.body.parent_emp_code
					})
					.save()
					.then(result => {
						console.log(result)
						res.status(200).send(result)
					})
					.catch(error => {
						console.log(error)
						res.status(500).json('Oops! An error occured')
					})
			}
			else {
				hierarchyModel.update(
					{ parent_emp_code: req.body.parent_emp_code },
					{ where: { id: result.id } }
				)
				.then(result => {
					console.log(result)
					res.status(200).send(result)
				})
				.catch(error => {
					console.log(error)
					res.status(500).json('Oops! An error occured')
				})
			}
		})
	})

router.route('/:id')
	.delete((req, res) => {
		hierarchyModel.findById(req.params.id)
		.then((hierarchy) => {
			console.log(hierarchy)

			hierarchyModel.update({
				parent_emp_code: hierarchy.parent_emp_code
			},
				{ where: { parent_emp_code: hierarchy.emp_code } })

			hierarchy.destroy()

			res.status(200).json({ message: 'Deleted sucessfully' })
		})
		.catch(err => {
			console.log(err)
			res.status(500).json({ message: 'Opps! Some error happened!!' })
		})
	})

router.route('/parents/:empCode')
	.get(async (req, res) => {

		try {
			let firstParent, secondParent
			let result = []
			firstParent = await getParent(req.params.empCode)
			if (firstParent) {

				secondParent = await getParent(firstParent.emp_code)
				if (secondParent) {
					result = [firstParent, secondParent]
				}
				else {
					result = [firstParent]
				}
			}


			return res.status(200).json(result)
		}
		catch (err) {
			console.log(err)
			return null
		}


	})

function insertEmpNode(empCode) {
	return employeeModel.findOne({
		where: { emp_code: empCode }
	})
	.then(emp => {
		if (!emp) return null
		return hierarchyModel.create({
			emp_code: empCode
	})
	.then(result => {
		return hierarchyModel.findOne({
			where: { emp_code: empCode },
			include: [
				{
					model: employeeModel,
					include: [
						{ model: designationModel },
						{ model: projectModel }
					]
				}
			]
		})
		.then(emp => {
			console.log(emp)
			return Object.assign(
				{},
				{
					id: emp.id,
					emp_code: emp.emp_code,
					first_name: emp.employee.first_name,
					middle_name: emp.employee.middle_name,
					last_name: emp.employee.last_name,
					project: emp.employee.project.name,
					designation: emp.employee.designation.name,
				})
			})
		})
	})
}

function getParent(empCode) {

	return new Promise((resolve, reject) => {
		hierarchyModel.findOne({
			where: { emp_code: empCode },
			include: [{
				model: employeeModel,
				as: "parent",
				include: [{ model: designationModel }]
			}]
		})
			.then(emp => {
				if (!emp) reject
				if (emp && emp.parent) {
					parent = {
						emp_code: emp.parent.emp_code,
						first_name: emp.parent.first_name,
						last_name: emp.parent.last_name,
						designation: emp.parent.designation.name
					}
				} else {
					parent = null
				}

				resolve(parent)

			})
			.catch(err => {
				console.log(err)
				reject
			})
	})
}

module.exports = router