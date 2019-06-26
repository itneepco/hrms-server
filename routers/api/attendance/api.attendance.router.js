const router = require('express').Router()

router.use('/project/:projectId/groups', require('./group.router'))
router.use('/project/:projectId/shifts', require('./shift.router'))


module.exports = router