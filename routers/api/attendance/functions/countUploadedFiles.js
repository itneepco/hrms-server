async function countUploadedFile(a_directory, a_file_prefix, a_filename_length, a_file_extension) {
  
    let p = new Promise((resolve, reject) => {
      if (
        (
          (a_directory !== '')        &&
          (a_directory !== null)      &&
          (a_directory !== undefined) &&
          (a_directory !== false)
        ) &&
        (
          (a_file_prefix !== '')        &&
          (a_file_prefix !== null)      &&
          (a_file_prefix !== undefined) &&
          (a_file_prefix !== false)
        ) &&
        (
          (a_filename_length !== '')        &&
          (a_filename_length !== null)      &&
          (a_filename_length !== undefined) &&
          (a_filename_length !== false)     &&
          (a_filename_length !== 0)
        ) &&
        (
          (a_file_extension !== '')        &&
          (a_file_extension !== null)      &&
          (a_file_extension !== undefined) &&
          (a_file_extension !== false)
        )
      ) {
        const fs = require('fs');
        
        directory        = a_directory;
        file_prefix      = a_file_prefix;
        file_name_length = a_filename_length;
        file_extension   = a_file_extension;
        
        fs.readdir(directory, 'utf-8', (error, files) => {
          
          if (!error) {
            let attendance_file = [];
            let machine_ids     = [];
            
            for (let file of files) {
              if (
                (file.length                   === file_name_length) &&
                (file.startsWith(file_prefix)  === true) &&
                (
                  file.endsWith(file_extension) === true || 
                  file.endsWith(file_extension.toLowerCase()) === true ||
                  file.endsWith(file_extension.toUpperCase()) === true
                  )
              ) {
                attendance_file.push(file);
              } else {
                continue;
              }
            }
            
            for (let file of attendance_file) {
              machine_ids.push(file.substring(6, 9));
            }
            resolve({status: true, result: machine_ids});
          } else {
            reject({status: false, result: 'Can not read the upload directory'});
          }
        });
      } else {
        reject({status: false, result: 'Issue with function parameter'});
      }
    });
           
    return p;
  }

  module.exports = countUploadedFile