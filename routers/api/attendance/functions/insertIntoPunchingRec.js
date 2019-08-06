const readline = require("readline");
const fs = require("fs");

function insertIntoPunchingRec(file, emp_code, project_id) {
  try {
    const dd = file.originalname.substring(0, 2);
    const mm = file.originalname.substring(2, 4);
    const yy = file.originalname.substring(4, 6);
    const mc = file.originalname.substring(6, 9);

    const readInterface = readline.createInterface({
      input: fs.createReadStream(file.path),
      crlfDelay: Infinity
    });

    return new Promise((resolve, reject) => {
      let recArray = [];
      readInterface
        .on("line", line => {
          if (line.length === 0) return;
          let tst = line.split(" ");
          let rec = {
            punching_date: "20" + yy + "-" + mm + "-" + dd,
            emp_code: tst[0],
            machine_no: mc,
            punching_time: tst[1] + ":00",
            created_by: emp_code,
            project_id: project_id
          };
          recArray.push(rec);
        })
        .on("close", () => {
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
          return resolve(recArray);
        })
    });
  } catch (error) {
    console.log(error);
    return Promise.reject(error);
  }
}

module.exports = insertIntoPunchingRec;
