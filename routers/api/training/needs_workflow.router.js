const router = require('express').Router();
const Codes = require('../../../global/codes');
const db = require('../../../config/db');
const TrainingNeedsInfo = require('../../../model/training/trainingNeedsInfo.model')

router.route('/:needsInfoId/actions')
  .post((req, res) => {
    let action = req.body.workflow_action
    if (action === Codes.NEEDS_INFO_SUBMITTED) { 
      trainingNeedsSubmit(req, res)
    }
    if (action === Codes.NEEDS_INFO_RECOMMENDED) { 
      trainingNeedsRecommended(req, res)
    }
    if (action === Codes.NEEDS_INFO_APPROVED) { 
      trainingNeedsApproved(req, res)
    }
  })

function trainingNeedsSubmit(req, res) {
  db.transaction().then(t => { 
    TrainingNeedsInfo.find({ where: { id: req.params.needsInfoId }})
    .then(result => {
      if(!result) return;

      return TrainingNeedsInfo.update({
        addresse: req.body.addressee,
        status: Codes.NEEDS_INFO_SUBMITTED
      }, {transaction: t})
    })
    .then(() => {
      t.commit();
      res.status(200).json({message: "Training Needs Info processing successful", error: err })
    })
    .catch((err) => {
      res.status(500).json({message: "Training Needs Info processing unsuccessful", error: err })
      console.log(err)
      t.rollback()
    })
  })
}  

function trainingNeedsRecommended(req, res) {
  db.transaction().then(t => { 
    TrainingNeedsInfo.find({ where: { id: req.params.needsInfoId }})
    .then(result => {

    })
  })
}

function trainingNeedsApproved(req, res) {
  db.transaction().then(t => { 
    
  })
}

module.exports = router