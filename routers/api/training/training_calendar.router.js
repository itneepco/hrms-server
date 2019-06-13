const router = require('express').Router();
const path = require('path');
const Op = require('sequelize').Op;
const codes = require('../../../global/codes');
const trainingInfo = require('../../../model/training/trainingInfo.model');

router.route('/')
.get((req, res) => {
  trainingInfo.findAll({ 
    where: { 
      project_id: req.user.project_id, 
      status: {
        [Op.or]: [codes.TRAINING_PUBLISHED, codes.TRAINING_COMPLETED]
      } 
    },
  })
  .then(results => res.status(200).json(results))
  .catch(err=>{
    console.log(err)
    res.status(500).json({message:'Opps! Some error happened!!'})
  })  
})

module.exports = router