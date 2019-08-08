const router = require("express").Router({ mergeParams: true });
const wageMonthModel = require("../../../model/attendance/wageMonth.model");
const moment = require("moment");
const awaitErrorHandler = require('../../../middlewares/errorHandler');


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

router.route("/init").post(async(req, res) => {
  const {from_date,to_date}= req.body; 
  wageMonths = [
    {
      project_id: req.params.projectId,
      from_date:from_date,
      to_date: to_date,
      is_active: true,
      shift_roster_status: false,
      gen_roster_status: false
    },
    {
      project_id: req.params.projectId,
      from_date: moment(from_date).clone().add(1,'months'),
      to_date: moment(to_date).clone().add(1,'months'),
      is_active: false,
      shift_roster_status: false,
      gen_roster_status: false
    }
  ];

  try {
        const result = await  wageMonthModel.bulkCreate(wageMonths)
        res.status(200).json({message:'Success',error:false,data:result,});
  } catch (err) { 
        console.log(err.name);      
        res.status(500).json({ message: `Error:: ${err.name}`, error:true,data:null });
  } 
  
});

module.exports = router;
