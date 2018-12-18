var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var app =   express();

var logic = require('./st_modules/main.js');

var pubAddress="0x58deecc0b671b8fc83b81b6153ad3565de430f03";
const password = "falconshaheen$";
//const datadir = "/home/pi/.ethereum/testnet";
const datadir = "D:/testnet";

// view engine setup

//app runs on port 4000;
//var res = IO.web3Init();
//console.log(res.c[0]);

//sensor.LightReading();
logic.main(pubAddress,password,datadir);




/*var Data = sensor.TempReading();
IO.web3CallLogTrackingInfo(pubAddress,pvtkey,Data);*/
//IO.test();
//setInterval(IO.web3CallLogTrackingInfo(pubAddress,pvtkey,Data), 10*1000);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
