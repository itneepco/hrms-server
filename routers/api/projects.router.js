
const router = require('express').Router()
const Op = require('sequelize').Op;

const ProjectModel = require('../../model/project.model')
const HolidayModel = require('../../model/holiday.model')
const codes = require('../../global/codes');
const LeaveAppModel = require('../../model/leaveApplication.model')
const LeaveDetailModel = require('../../model/leaveDetail.model')
const EmployeeModel = require('../../model/employee.model');

router.get('/', (req, res) => {
	ProjectModel.findAll({
		order: [
			['name', 'ASC']
		]
	})
		.then(result => res.status(200).json(result))
		.catch(err => {
			console.log(err)
			res.status(500).json({ message: 'Opps! Some error happened!!' })
		})
})

router.get('/:id', (req, res) => {
	ProjectModel.findById(req.params.id)
		.then(result => res.status(200).json(result))
		.catch(err => {
			console.log(err)
			res.status(500).json({ message: 'Opps! Some error happened!!' })
		})
})

router.route('/:id/calendar')
	.get((req, res) => {
		HolidayModel.findAll({
			where: { project_id: req.params.id },
			order: [['day', 'ASC']]
		})
			.then(result => res.status(200).json(result))
			.catch(err => {
				console.log(err)
				res.status(500).json({ message: 'Opps! Some error happened!!' })
			})
	})

router.route('/:id/approved-leave')
	.get((req, res) => {
    let from_date = req.query.from_date
    let to_date = req.query.to_date
    console.log(from_date, to_date)

		LeaveAppModel.findAll({
			order: [['updated_at', 'DESC']],
			distinct: true,
			where: {
				status: codes.LEAVE_APPROVED
			},
			include: [
				{
					model: EmployeeModel,
					as: "leaveApplier",
					attributes: ['emp_code', 'first_name', 'last_name'],
					where: {
						project_id: req.params.id
					}
				},
				{
					model: LeaveDetailModel,
					where: {
            [Op.or]: [
              { 
                from_date: {
                  [Op.between]: [ req.query.from_date, req.query.to_date],
                }
              },
              { 
                to_date: {
                  [Op.between]: [ req.query.from_date, req.query.to_date],
                }
              }
            ]
					}
				}
			]
		})
		.then(results => {
			if (!results) return res.status(200).json(null)

			console.log(JSON.stringify(results))
			let approved_leaves = results.map(result => {

				return Object.assign(
					{},
					{
						id: result.id,
						emp_code: result.emp_code,
						first_name: result.leaveApplier.first_name,
						last_name: result.leaveApplier.last_name,

						leaveDetails: result.leaveDetails.map(leaveDetail => {
							return Object.assign({}, {
								leave_type: leaveDetail.leave_type,
								from_date: leaveDetail.from_date,
								to_date: leaveDetail.to_date
							})
						})
					}
				)
			})
			
			return res.status(200).json(approved_leaves)
		})
		.catch(err => {
			console.log(err)
			return res.status(500).json({ message: 'Opps! Some error happened!!' })
		})
	})

router.use('/:id/holidays', require('./holiday.router'))

module.exports = router