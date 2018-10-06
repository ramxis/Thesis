var GrovePi = require('node-grovepi').GrovePi;
var Commands = GrovePi.commands;
var Board = GrovePi.board;
var express = require('express');
var fs = require('fs');
var IO = require('./Utils.js');
//var sensor = require('./sensors.js');
var read = require('./sensors.js');
var PQ = require('./pqHash.js');
const Log_Interval = 60;//60sec or 2 min
const IPFS_Interval = Log_Interval*Log_Interval; //60min or 1h
var message = "Zanbeel";
var reqList;
var board;
var pvtkey;
var pubkey;
var closeInterval;
async function Main(pubaddress,password,datadir) {

  IO.Init(pubaddress);

  //var pvtkey = IO.getPvtKey(pubaddress,password,datadir);
  pvtkey = IO.getPvtKey(pubaddress,password,datadir);
  pubkey = pubaddress;
  IO.setTrackingNr("07b323db");

  PQ1="eff3bc952afdc46400bcfc07a5699f525119760f364cb04129323e207fcdc18c"
  PQ2="d6cea69138fa00da0fa2af65912191ad45b35a690150855e99c2f3c293334f85";

  IO.setIDPQkey("DHLDarmstadt1",PQ1);


  console.log('the tracking nr is:' + IO.getTrackingNr());

  reqList = await IO.w3call_GetRequirements(IO.getTrackingNr());
  console.log(reqList);
  var reqIDARR = [];
  for(var i=0;i<reqList.length;i++) {
      reqIDARR.push(reqList[i][0]);
  }


  console.log("req Array is:",reqIDARR);
  //read.ButtonPress();
  try
  {
    //Interval = setInterval(function(){MonitorPkgConditions(reqList,pubaddress,pvtkey,message);},Log_Interval*1000);
    InitializeSensors(reqList,pubaddress,pvtkey,message);
  }
  catch(err)
  {
    console.log(err);
  }

}
function InitializeSensors(reqList,pubAddress,pvtkey,message) {
  //read.Test("TEST",pvtkey,reqList);
  board = new Board({
    debug: true,
    onError: function(err) {
      console.log('Something wrong just happened');
      console.log(err);
    },
    onInit: function(res) {
      if (res) {

        Interval = setInterval(function(){MonitorPkgConditions(reqList,pubAddress,pvtkey,message);},25*1000);
      }
    }
  })

  board.init();
  read.RotarySensor();
  read.ButtonPress();
}
function MonitorPkgConditions(reqList,pubAddress,pvtkey,message) {
  for(var i=0;i<reqList.length;i++) {
    var Data;
    var GPS;
    //get all sensors data and then send tx with await, so no violation is missed as we wait earlier tx to be mined
    if(reqList[i][0]=="TEMP") {
      //var temp = read.TempSensor();
      GPS = read.GPSReading();
      Data = read.TempSensor();
      Data.trackingNr = IO.getTrackingNr();
      Data.status = "Shipping";//TODO:getStatus() // based on slong and latitude
      Data.Loc = GPS.Loc;
      //get shipper ID
      //var Hash=IO.tempHash(message);
      IO.writeLog(Data);
      chkViolations(Data,reqList[i],pubAddress,pvtkey);//chk violations

    }
    else if(reqList[i][0]=="PRESSURE") {
      //read.SensorReading();
      GPS = read.GPSReading();
      Data = read.PressureReading();
      Data.trackingNr = IO.getTrackingNr();
      Data.status = "Shipping";
      Data.Loc = GPS.Loc;
      //get shipper ID
      //var Hash=IO.tempHash(message);
      //console.log("pressure called");
      IO.writeLog(Data);
      chkViolations(Data,reqList[i],pubAddress,pvtkey);//chk violations

    }
    else if(reqList[i][0]=="HUMIDITY") {
      //var humidity = read.HumiditySensor();
      GPS = read.GPSReading();
      Data = read.HumiditySensor();
      Data.trackingNr = IO.getTrackingNr();
      Data.status = "Shipping";
      Data.Loc = GPS.Loc;
      //get shipper ID
      //var Hash=IO.tempHash(message);
      //console.log("Read Humidity");
      IO.writeLog(Data);
      chkViolations(Data,reqList[i],pubAddress,pvtkey);//chk violations
    }
    else if(reqList[i][0]=="LUX") {
      //var light = read.LightSensor();
      GPS = read.GPSReading();
      Data = read.LightSensor();
      Data.trackingNr = IO.getTrackingNr();
      Data.status = "Shipping";
      Data.Loc = GPS.Loc;
      //get shipper ID
      //var Hash=IO.tempHash(message);
      //console.log("Read Light");
      IO.writeLog(Data);
      chkViolations(Data,reqList[i],pubAddress,pvtkey);//chk violations

    }
    else if(reqList[i][0]=="TID") {
      console.log("TID Called");
      //sensor.close();
    }
  }
}


function chkViolations(sensorData,Req,pubAddress,pvtkey) {
  //console.log('requirements are:',Req);
  var req = {
    _minValue:Req[3].toNumber(),
    _maxValue:Req[4].toNumber(),
    _minFlag:Req[5],
    _maxFlag:Req[6]
  }

  if(req._minFlag&&req._maxFlag) {
    console.log("checking MinMAX");

    if(sensorData.value<req._minValue) {
      console.log("Min in MInMax",req._minValue)//TODO:remove
      IO.w3call_LogTrackingInfo(pubAddress,pvtkey,sensorData);
    }
    if(sensorData.value>req._maxValue) {
      console.log("Max in MInMax",req._maxValue)//TODO:remove
      IO.w3call_LogTrackingInfo(pubAddress,pvtkey,sensorData);
    }

  }

  if((!req._minFlag)&&(req._maxFlag)) {
      console.log("checking MAX");

    if(sensorData.value>req._maxValue) {
      IO.w3call_LogTrackingInfo(pubAddress,pvtkey,sensorData);
    }

  }

  if((req._minFlag)&&(!req._maxFlag)) {
    console.log("checking MIN");
    if(sensorData.value<req._minValue) {
      IO.w3call_LogTrackingInfo(pubAddress,pvtkey,sensorData);
    }

  }

}

function watchContractEvents() {
  IO.w3Event_ShippingEvents();
}

function deliver() {
  var GPS = read.GPSReading();
  Data = read.LightSensor();
  Data.trackingNr = IO.getTrackingNr();
  Data.status = "Delivered";
  Data.Loc = GPS.Loc;
  return Data;
}

async function StopSensing() {
  /*clearInterval(Interval_ipfs);
  clearInterval(Interval_hash);
  IO.w3call_SetIpfsHash("07b323db",pubkey,pvtkey);*/
  //TODO:comment above code in when Inufra allows ipfs.files.write again or using local ipfs node
  var pkg = deliver();
  await IO.w3call_LogTrackingInfo(pubkey,pvtkey,pkg);
  console.log('ending logging in 60 seconds');
  setTimeout(function(){IO.package_Delivered(pubkey,pvtkey);}, 60*000);//IO.package_Delivered(pubkey,pvtkey);//call ipfs funcs after 1 min
  //closeInterval = setInterval(function(){gracefulClose();},30*1000); // check to close everything every 20 sec

}
// called on Ctrl-C.
// close the board and clean up
function onExit(err) {
  console.log('ending')
  board.close();
  process.removeAllListeners();
  process.exit();
  if (typeof err != 'undefined')
    console.log(err)
}
function gracefulClose() {
  console.log("Stopping: ");
  //if(IO.stopFlag==1) {
    board.close();
    clearInterval(closeInterval);
    process.removeAllListeners();
    process.exit();
  //}

}
// catches ctrl+c event
process.on('SIGINT', onExit)

module.exports.main = Main;
module.exports.StopSensing = StopSensing;
module.exports.gracefulClose = gracefulClose;

