const readline = require('readline');
const fs = require('fs');
const fileName = '021218036.DAT';
const dd = fileName.substring(0,2);
const mm = fileName.substring(2,4);
const yy = fileName.substring(4,6);
const mc = fileName.substring(6,9);
const readInterface = readline.createInterface({
  input: fs.createReadStream(fileName),
  crlfDelay: Infinity
});

readInterface.on('line', (line) => {
  let tst = line.split(' ')
  let rec = {
    day: dd+'-'+mm+'-'+yy,
    machine_no: mc,
    emp_code : tst[0],
    punch_time: tst[1]
  }
  console.log(rec)
  
});

    