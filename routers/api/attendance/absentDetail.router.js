const router = require("express").Router({ mergeParams: true });
const absentDetailModel = require("../../../model/attendance/absentDetail.model");
const leaveTypeModel = require("../../../model/shared/leaveType.model");

router
  .route("/")
  .get((req, res) => {
    let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0;
    let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50;
    let offset = pageIndex * limit;
    
    absentDetailModel
      .findAndCountAll({
        where: { emp_code: req.params.empCode },
        order: [["from_date", "DESC"]],
        limit: limit,
        offset: offset,
        include: [{ 
          model: leaveTypeModel
        }]
      })
      .then(result => res.status(200).json(result))
      .catch(err => {
        console.log(err);
        res.status(500).json({ message: "Opps! Some error occured!!" });
      });
  })
  .post((req, res) => {
    absentDetailModel
      .build({
        emp_code: req.params.empCode,
        from_date: req.body.from_date,
        to_date: req.body.to_date,
        leave_type_id: req.body.leave_type_id,
        project_id: req.params.projectId
      })
      .save()
      .then(result => {
        console.log(result);
        absentDetailModel
          .findOne({
            id: req.params.id,
            include: [{ 
              model: leaveTypeModel,
              as: 'leave_type' 
            }] 
          })
          .then(result => res.status(200).json(result))
          .catch(err => {
            console.log(err);
            res.status(500).json({ message: "Opps! Some error happened!!" });
          });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json("Oops! some error occured!!");
      });
  });

router
  .route("/:id")
  .get((req, res) => {
    absentDetailModel
      .findById(req.params.id)
      .then(result => res.status(200).json(result))
      .catch(err => {
        console.log(err);
        res.status(500).json("Oops! some error occured");
      });
  })

  .put((req, res) => {
    absentDetailModel
      .update(
        {
          emp_code: req.params.empCode,
          from_date: req.body.from_date,
          to_date: req.body.to_date,
          leave_type_id: req.body.leave_type_id,
          project_id: req.params.projectId
        },
        { where: { id: req.params.id } }
      )
      .then(() => {
        absentDetailModel
          .findOne({
            id: req.params.id,
            include: [{ 
              model: leaveTypeModel,
              as: 'leave_type' 
            }] 
          })
          .then(result => res.status(200).json(result))
          .catch(err => {
            console.log(err);
            res.status(500).json({ message: "Opps! Some error happened!!" });
          });
      })
      .catch(err => {
        console.log(err);
        res.status(500).json({ message: "Opps! Some error happened!!" });
      });
  })
  .delete((req, res) => {
    absentDetailModel
      .destroy({ where: { id: req.params.id } })
      .then(result => res.status(200).json(result))
      .catch(err => {
        console.log(err);
        res.status(500).json({ message: "Opps! Some error happened!!" });
      });
  });

module.exports = router;
