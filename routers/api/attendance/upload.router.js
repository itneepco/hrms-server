const router = require("express").Router();
const multer = require("multer");
const readline = require("readline");
const fs = require("fs");

const PunchingRecModel = require("../../../model/attendance/punchingRec.model");

//--multer disk storage settings
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function(req, file, cb) {
    let name = file.originalname;
    cb(null, name);
  }
});

//-- multer settings
const upload = multer({
  storage: storage
}).single("dataFile");

/* API end point setup */
router
  .route("/")
  .post((req, res) => {
    upload(req, res, err => {
      if (err) {
        res.json({ error_description: err });
        return;
      }
      if (!req.file) {
        res.json({ message: "No Files passed", error_desc: err });
        return;
      }
      try {
        const dd = req.file.originalname.substring(0, 2);
        const mm = req.file.originalname.substring(2, 4);
        const yy = req.file.originalname.substring(4, 6);
        const mc = req.file.originalname.substring(6, 9);

        const readInterface = readline.createInterface({
          input: fs.createReadStream(req.file.path),
          crlfDelay: Infinity
        });

        let recArray = [];
        readInterface
          .on("line", line => {
            let tst = line.split(" ");
            let rec = {
              punching_date: "20" + yy + "-" + mm + "-" + dd,
              emp_code: tst[0],
              machine_no: mc,
              punching_time: tst[1] + ":00",
              created_by: req.user.emp_code
            };
            recArray.push(rec);
          })
          .on("close", () => {
            insertData(req, res, recArray);
            //res.status(200).json({ message:'Success',data: recArray });
          });
      } catch (e) {
        res.status(500).json({ message: "Error Occured!", error_desc: e });
      }
    });
  });

function insertData(req, res, inputArr) {
  PunchingRecModel.bulkCreate(inputArr, {
    updateOnDuplicate: [
      "punching_date",
      "emp_code",
      "punching_time",
      "machine_no",
      "creared_by",
      "updated_at"
    ]
  })
  .then(result => res.status(200).json(result))
  .catch(err => {
    console.log(err);
    res.status(500).json({ message: "Opps! Some error occured!!" });
  });
}

module.exports = router;
