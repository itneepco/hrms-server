const router = require('express').Router()

router.use('/projects', require('./projects.router'))
router.use('/employees', require('./employee.router'))
router.use('/hierarchy', require('./hierarchy.router'))
module.exports = router