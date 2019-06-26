const router = require('express').Router()

router.use('/project/:projectId/groups', require('./group.router'))
module.exports = router