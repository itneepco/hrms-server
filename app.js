const express =  require('express');
const app = express();
const sequelize = require('./config/db');
const bodyParser = require('body-parser');
const cors = require('cors');
app.use(bodyParser.json());
app.use(cors());


sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

app.get('/',(req,res)=>{
    res.send('Welcome to HRMS APP');
});
app.use('/api', require('./routers/api/api.router'))
const AuthRouter = require('./routers/auth.router')
app.use('/auth',AuthRouter);
const HolidayRouter = require('./routers/holiday.router');
app.use('/holiday',HolidayRouter);



app.listen(3000,()=>{
    console.log('HRMS App Started at port 3000!');
})