const router = require("express").Router({ mergeParams: true });
const wageMonthModel = require("../../../model/attendance/wageMonth.model");

router.route("/active").get((req, res) => {
  wageMonthModel
    .findOne({
      where: {
        is_active: true,
        project_id:req.params.projectId
      }
    })
    .then(result => {
      res.status(200).send(result);
    })
    .catch(err => {
      console.log(err);
      res.status(500).json("Oops! some error occured!!");
    });
});

router.route("/init").post((req, res) => {

  fromDate = new Date(req.body.from_date);
  toDate = new Date(req.body.to_date);
  fromDateNext = new Date(new Date(req.body.from_date).setMonth(fromDate.getMonth() + 1))
  toDateNext = new Date(    new Date(req.body.to_date).setMonth(toDate.getMonth() + 1))
  wageMonths = [
    {
      project_id: req.params.projectId,
      from_date:fromDate,
      to_date: toDate,
      is_active: true,
      shift_roster_status: false,
      gen_roster_status: false
    },
    {
      project_id: req.params.projectId,
      from_date: fromDateNext,
      to_date: toDateNext,
      is_active: false,
      shift_roster_status: false,
      gen_roster_status: false
    }
  ];

  wageMonthModel
    .bulkCreate(wageMonths)
    .then(result => res.status(200).json(result))
    .catch(err => {
      console.log(err);
      res
        .status(500)
        .json({ message: "Opps! Some error occured!!", error: err.name });
    });
});

module.exports = router;
