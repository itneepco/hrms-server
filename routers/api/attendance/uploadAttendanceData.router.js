const router = require("express").Router({ mergeParams: true });
const path = require("path");
const insertIntoPunchingRec = require("./functions/insertIntoPunchingRec");
const PunchingRecModel = require('../../../model/attendance/punchingRec.model')
const countUploadedFile = require('./functions/countUploadedFiles');
const enumerateBetweenDates = require('./functions/enumerateDaysBetweenDates');

const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `./uploads/${req.user.project_id}`);
  },
  filename: function (req, file, cb) {
    let name = file.originalname;
    cb(null, name);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (
      !(
        path.extname(file.originalname) === ".dat" ||
        path.extname(file.originalname) === ".DAT"
      )
    ) {
      return cb(new Error("Only dat files are allowed"));
    }
    cb(null, true);
  }
}).array("dataFile");

router.route("/").post((req, res) => {
  upload(req, res, err => {
    if (err) {
      console.log(err);
      return res
        .status(500)
        .json({ message: "oops error occured", error: err });
    }
    promiseArr = [];
    console.log(req.files);

    req.files.forEach(file => {
      console.log(file);
      promiseArr.push(insertIntoPunchingRec(file, req.user.emp_code, req.params.projectId));
    });

    Promise.all(promiseArr)
      .then(results => {
        resultArr = [];
        results.forEach(result => {
          resultArr.push(...result);
        });
        return PunchingRecModel.bulkCreate(resultArr, {
          updateOnDuplicate: ["punching_date", "emp_code", "punching_time"]
        })
          .then(() => {
            res.status(200).json({ message: "Successfully uploaded the dat file" });
          })
      })
      .catch(err => {
        console.log(err);
        return res
          .status(500)
          .json({ message: "oops error occured", error: err });
      });
  });
});

router.route("/status").get(async (req, res) => {
  const fromDate = req.query.from_date;
  const toDate = req.query.to_date;

  let dates = enumerateBetweenDates(fromDate, toDate);
  //console.log(dates);
  let upload_status = [];

  try {
    for (let date of dates) {
      let day = date.getDate();
      let month = date.getMonth() + 1;
      let year = date.getFullYear();
      let year_number = '';
      day = day < 10 ? '0' + day.toString() : day.toString();
      month = month < 10 ? '0' + month.toString() : month.toString();
      year_number = (year.toString()).substring(2, 4);
      file_prefix = day + month + year_number;
      //To do change ---location make dynamic
      let result = await countUploadedFile(`./uploads/${req.user.project_id}`, file_prefix, 13, '.DAT');
      if (result.status !== false) {
        if (result.result.length > 0) {
          upload_status.push({
            'punch_day': year.toString() + '-' + month + '-' + day,
            'machine_ids': result.result
          });
        }
      }
    }
    res.status(200).json(upload_status);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "oops error occured", error: err });
  }
});

module.exports = router;
