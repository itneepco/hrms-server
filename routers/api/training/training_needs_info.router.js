const router = require('express').Router()
const needsInfoModel = require('../../../model/training/trainingNeedsInfo.model')

router.route('/employee/:empCode')
.get((req, res) => { 
  needsInfoModel.findAll({
    where: {
      emp_code: req.params.empCode
    }
  })
  .then(data => res.status(200).json(data))
  .catch(err => {
    console.log(err)
    res.status(500).json({message: 'Opps! Some error happened!!', error: err })
  })  
})

module.exports = router