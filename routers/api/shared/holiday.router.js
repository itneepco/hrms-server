const router = require("express").Router({ mergeParams: true });
const holidayModel = require("../../../model/shared/holiday.model");
const validateAdmin = require('../../../middlewares/validateAdmin');
const Op = require("sequelize").Op;
const formatDate = require('../shared/functions/formatDate')

router
  .route("/")
  .get((req, res) => {
    let pageIndex = req.query.pageIndex ? parseInt(req.query.pageIndex) : 0;
    let limit = req.query.pageSize ? parseInt(req.query.pageSize) : 50;
    let offset = pageIndex * limit;

    holidayModel
      .findAndCountAll({
        where: { project_id: req.params.id },
        order: [["day", "DESC"]],
        limit: limit,
        offset: offset
      })
      .then(result => res.status(200).json(result))
      .catch(err => {
        console.log(err);
        res.status(500).json({ message: "Opps! Some error happened!!" });
      });
  })
  .post(validateAdmin,(req, res) => {
    holidayModel
      .build({
        name: req.body.name,
        day: req.body.day,
        type: req.body.type,
        project_id: req.params.id
      })
      .save()
      .then(result => {
        console.log(result);
        res.status(200).send(result);
      })
      .catch(error => {
        console.log(error);
        res.status(500).json("Oops! An error occured");
      });
  })
  .delete(validateAdmin,(req, res) => {
    holidayModel
      .destroy({ where: { project_id: req.params.id } })
      .then(result => res.status(200).json(result))
      .catch(err => {
        console.log(err);
        res.status(500).json({ message: "Opps! Some error happened!!" });
      });
  });

  router.route("/period")
  .get((req, res) => {
    fromDate = formatDate(req.query.from_date)
    toDate = formatDate(req.query.to_date)
    holidayModel
    .findAll({
      where: {
        project_id: req.params.id,
        day: {
          [Op.between]: [fromDate,toDate]
        }
      },
      order: [["day", "ASC"]]
    })
    .then(result => res.status(200).json(result))
    .catch(err => {
      console.log(err);
      res.status(500).json({ message: "Opps! Some error happened!!" })
    })
    
  })

router
  .route("/:holiday")
  .delete(validateAdmin,(req, res) => {
    holidayModel
      .destroy({ where: { id: req.params.holiday, project_id: req.params.id } })
      .then(result => res.status(200).json(result))
      .catch(err => {
        console.log(err);
        res.status(500).json({ message: "Opps! Some error happened!!" });
      });
  })
  .get((req, res) => {
    holidayModel
      .findAll({ where: { id: req.params.holiday, project_id: req.params.id } })
      .then(result => res.status(200).json(result))
      .catch(err => {
        console.log(err);
        res.status(500).json({ message: "Opps! Some error happened!!" });
      });
  });

router.route("/:holiday").put(validateAdmin,(req, res) => {
  holidayModel
    .update(
      { name: req.body.name, day: req.body.day, type: req.body.type },
      { where: { id: req.params.holiday, project_id: req.params.id } }
    )
    .then(() => {
      holidayModel
        .findById(req.params.holiday)
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
});


module.exports = router;
