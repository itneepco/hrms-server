const readline = require("readline");
const fs = require("fs");
const PunchingRecModel = require("../../../../model/attendance/punchingRec.model");

function insertData(inputArr) {
  return PunchingRecModel.bulkCreate(inputArr, {
    updateOnDuplicate: ["punching_date", "emp_code", "punching_time"]
  });
}

function insertIntoPunchingRec(file, user) {
  try {
    const dd = file.originalname.substring(0, 2);
    const mm = file.originalname.substring(2, 4);
    const yy = file.originalname.substring(4, 6);
    const mc = file.originalname.substring(6, 9);

    const readInterface = readline.createInterface({
      input: fs.createReadStream(file.path),
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
          created_by: user
        };
        recArray.push(rec);
      })
      .on("close",  () => {
        recArray = recArray.filter((row, index, self) => {
          return (
            index ===
            self.findIndex(
              t =>
                t.emp_code === row.emp_code &&
                t.day === row.day &&
                t.punching_time === row.punching_time
            )
          );
        });
        console.log("Record array length : " + recArray.length);
        return insertData(recArray);
       
      });
  } catch (error) {
    console.log(error);
    return new Promise().reject(error);
  }
}

module.exports = insertIntoPunchingRec;
