const express =  require('express');
const app = express();
const sequelize = require('./config/db');
const bodyParser = require('body-parser');
const cors = require('cors');
const jwtExtractor = require('./middlewares/jwtExtractor')
const compression = require('compression')

app.use(bodyParser.json());
// app.use(cors());
app.use(cors({credentials: true, origin: 'http://10.3.0.214:4200'}));

sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

const AuthRouter = require('./routers/auth.router')
app.use('/auth', AuthRouter);

app.use('/api', jwtExtractor, require('./routers/api/api.router'))

app.use('/', compression(), express.static('public'));

app.all('*', function(req, res) {
  res.redirect('/');
});

// error handler
app.use(function(err, req, res, next) {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};
  
// render the error page
	res.status(err.status || 500);
	res.json(err);
});

app.listen(4000,()=>{
    console.log('HRMS App Started at port 4000!');
})