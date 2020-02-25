const router = require("express").Router({ mergeParams: true });
const attendanceApplication = require('../../../model/attendance/attendanceApplication.model')
const attendanceApplicationHistory = require('../../../model/attendance/attendanceApplicationHistory.model')
const employee = require('../../../model/shared/employee.model')
const designation = require('../../../model/shared/designation.model')
const codes = require('../../../global/codes');
const db = require('../../../config/db');

router.route('/pending/:emp_code').get(async(req,res)=>{
  attendanceApplication.findAll({
    where:{
      addresse: req.params.emp_code
    },
    include: [{ 
                model: employee,
                as: "applier",
              
                include:[
                  {model: designation}
                ]
              },
              {
                model:employee,
                as: 'mutual_employee',
                include:[
                  {model: designation}
                ]
              },
             { model: attendanceApplicationHistory, as: "applicationHistory",include:[
                 {model: employee, as: 'officer',include:[{model: designation}]}
             ]}]

  })
  .then(results =>{
       let app = results.map(result=> Object.assign({},{
          id : result.id,
          day : result.day,
          reason : result.reason,
          status: result.status,         
          applier:{
            emp_code: result.applier.emp_code,
            emp_name: result.applier.first_name +' '+result.applier.last_name,
            designation: result.applier.designation.name            
          },
          isMutual: result.isMutual,
          applicationHistory:result.applicationHistory.map(data=>{ 
            return Object.assign({},{
              id: data.id,
              officer:{
              emp_code: data.officer.emp_code,
              emp_name: data.officer.first_name +' '+data.officer.last_name,
              designation: data.officer.designation.name
              },
              workflow_action: data.workflow_action,
              remarks: data.remarks,
              updated_at: data.updated_at
            })
          }),
          
               

        })
        )
        res.status(200).json(app)
       
       }
     
    )
  .catch(err=>{
    console.log(err)
    res.status(500).json({ message: "Opps! Some error occured!!" })
  }) 
 
   })                         

router.route("/").post(async(req,res)=>{
  db.transaction().then(t=>{
    return attendanceApplication.create({
      emp_code: req.body.emp_code,
      day: req.body.day,      
      addresse: req.body.addresse,
      reason: req.body.reason,
      isMutual: req.body.isMutual,
      mutual_emp_code: req.body.mutual_emp_code,
      status: codes.APPLIED,
    }, {transaction: t})
    .then(application =>{
         return attendanceApplicationHistory.create({
           application_id: application.id,
           officer_emp_code: req.body.addresse,
           workflow_action: codes.APPLIED,
           remarks: "Applied"
         })
    })
    .then(function () {
      res.status(200).json({ message: "Created successfully" })
      return t.commit();
    })
    .catch(function (err) {
      console.log(err)
      res.status(500).json({ message: "Some error occured", error: err })
      return t.rollback();
    });
  })
})

module.exports = router
