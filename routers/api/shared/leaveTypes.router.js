const router = require("express").Router({ mergeParams: true });

const LeaveTypeModel = require("../../../model/shared/leaveType.model");
router
  .route("/")
  .get((req, res) => {
   
    LeaveTypeModel
      .findAll()
      .then(result => res.status(200).json(result))
      .catch(err => {
        console.log(err);
        res.status(500).json({ message: "Opps! Some error occured!!" });
      });
  })


module.exports = router;
