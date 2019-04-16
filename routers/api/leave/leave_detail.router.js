const router = require('express').Router()
const getLeavesAlreadyApplied = require('./functions/getLeavesAlreadyApplied')

router.route('/employee/:empCode')
.get(async (req, res) => { 
  let leavesAlreadyApplied = await getLeavesAlreadyApplied(req, res)  

  res.status(200).json({
    emp_code: req.params.empCode,
    leaves: leavesAlreadyApplied
  })
})

module.exports = router