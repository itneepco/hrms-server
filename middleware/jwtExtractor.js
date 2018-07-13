
const jwt = require('jsonwebtoken');
const secret = require('../config/secret');

module.exports = (req,res,next)=>{
    const bearer = req.headers.authorization.split(" ")(1);
    jwt.verify(bearer,secret,(err,res)=>{
        if(err) return next(err)
        console.log(res)
        next(null,result)
    })
}