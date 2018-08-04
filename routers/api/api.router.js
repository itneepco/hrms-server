const router = require('express').Router()

router.use('/projects', require('./projects.router'))
router.use('/employees', require('./employee.router'))
router.use('/hierarchy', require('./hierarchy.router'))
router.use('/leave', require('./leave.router'))

module.exports = router