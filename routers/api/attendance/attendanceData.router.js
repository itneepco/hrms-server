const router = require("express").Router();
const path = require("path");
const insertIntoPunchingRec = require("./functions/insertIntoPunchingRec");

const multer = require("multer");
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function(req, file, cb) {
    let name = file.originalname;
    cb(null, name);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function(req, file, cb) {
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

router.route("/upload").post((req, res) => {
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
      promiseArr.push(insertIntoPunchingRec(file, req.user.emp_code));
    });

    Promise.all(promiseArr)
      .then(() => {
        res.status(200).json({ message: "Successfully uploaded the dat file" });
      })
      .catch(err => {
        console.log(err);
        return res
          .status(500)
          .json({ message: "oops error occured", error: err });
      });
  });
});
module.exports = router;
