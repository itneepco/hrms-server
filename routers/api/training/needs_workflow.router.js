const router = require('express').Router({mergeParams: true});
const Codes = require('../../../global/codes');
const db = require('../../../config/db');
const TrainingNeedsInfo = require('../../../model/training/trainingNeedsInfo.model')
const NeedInfoHist = require('../../../model/training/needsInfoHist.model')

router.route('/')
  .post((req, res) => {
    let action = req.body.workflow_action
    if (action === Codes.NEEDS_INFO_SUBMITTED) { 
      trainingNeedsSubmit(req, res)
    }
    if (action === Codes.NEEDS_INFO_RECOMMENDED) { 
      trainingNeedsRecommended(req, res)
    }
    if (action === Codes.NEEDS_INFO_RETURNED) { 
      trainingNeedsReturned(req, res)
    }
  })

function trainingNeedsSubmit(req, res) {
  processWorkflow(req, res, Codes.NEEDS_INFO_SUBMITTED)
}  

function trainingNeedsRecommended(req, res) {
  processWorkflow(req, res, Codes.NEEDS_INFO_RECOMMENDED)
}

function trainingNeedsReturned(req, res) {
  processWorkflow(req, res, Codes.NEEDS_INFO_RETURNED)
}

function processWorkflow(req, res, action) {
  db.transaction().then(t => {
    TrainingNeedsInfo.findById(req.params.needInfoId)
    .then(needInfo => {
      if(!needInfo) return;
      
      return NeedInfoHist.create({
        training_need_info_id: needInfo.id,
        officer_emp_code: req.body.officer_emp_code,
        workflow_action: action,
        remarks: req.body.remarks
      }, {transaction: t})

      .then(() => {
        return needInfo.update({
          addressee: req.body.addressee,
          status: action
        }, {transaction: t})
      })
    })
    .then(() => {
      t.commit();
      res.status(200).json({message: "Training Needs Info processing successful"})
    })
    .catch((err) => {
      res.status(500).json({message: "Training Needs Info processing unsuccessful", error: err })
      console.log(err)
      t.rollback()
    })
  })
}

module.exports = router