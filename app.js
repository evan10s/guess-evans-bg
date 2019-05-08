var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
require('dotenv').config();
const rateLimit = require("express-rate-limit");

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.enable("trust proxy");
app.disable('x-powered-by');

if (!process.env.SUGARMATE_URL) {
  throw new Error("Can't start - please define Sugarmate data URL");
}

const apiLimiter = rateLimit({
  windowMs: 3 * 1000,
  max: 2
});

app.use("/api/", apiLimiter);

app.use('/', index);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : { status: err.status };

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
