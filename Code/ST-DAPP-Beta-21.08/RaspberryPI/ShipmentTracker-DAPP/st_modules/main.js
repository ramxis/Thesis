var express = require('express');
var fs = require('fs');
var IO = require('./Utils.js');
var sensor = require('./sensors.js');
var PQ = require('./pqHash.js');
const Log_Interval = 60;//60sec or 2 min
const IPFS_Interval = Log_Interval*Log_Interval; //60min or 1h
var message = "Zanbeel";
var Hash;


async function Main(pubaddress,password,datadir) {

  IO.Init(pubaddress);

  var pvtkey = IO.getPvtKey(pubaddress,password,datadir);

  IO.setTrackingNr("07b323db");


  //Hash=PQ.getHash(message);
  Hash=IO.tempHash(message);

  console.log('the tracking nr is:' + IO.getTrackingNr());

  var reqList = await IO.w3call_GetRequirements(IO.getTrackingNr());
  console.log(reqList);
  var reqIDARR = [];
  for(var i=0;i<reqList.length;i++) {
      reqIDARR.push(reqList[i][0]);
      console.log(reqList[i][3].toNumber());
      console.log(reqList[i][4].toNumber());
  }

  //console.log(reqIDARR.includes("TEMP"));
  console.log(reqIDARR);
  try
  {
    Interval1 = setInterval(function(){LogTrackingData(reqList,pubaddress,pvtkey,message,Hash);},Log_Interval*1000);
  }
  catch(err)
  {
    console.log(err);
  }
  try
  {
    Interval = setInterval(function(){IO.writeLogIPFS();},90*1000);//also test with 60 sec
  }
  catch(err)
  {
    console.log(err);
  }

  //setInterval(IO.web3CallLogTrackingInfo(pubAddress,pvtkey,Data), 50*1000)
}



function LogTrackingData(reqList,pubAddress,pvtkey,message,Hash) {
  for(var i=0;i<reqList.length;i++) {
    var Data;
    var GPS;
    //get all sensors data and then send tx with await, so no violation is missed as we wait earlier tx to be mined
    if(reqList[i][0]=="TEMP") {
      GPS = sensor.GPSReading();
      Data = sensor.TempReading();
      Data.trackingNr = IO.getTrackingNr();
      Data.status = "Shipping";//TODO:getStatus() // based on slong and latitude
      Data.Loc = GPS.Loc;
      IO.writeLog(Data);
      //IO.w3call_LogTrackingInfo(pubAddress,pvtkey,Data,message,Hash);

    }
    else if(reqList[i][0]=="PRESSURE") {
      GPS = sensor.GPSReading();
      Data = sensor.PressureReading();
      Data.trackingNr = IO.getTrackingNr();
      Data.status = "Shipping";
      Data.Loc = GPS.Loc;
      console.log("pressure called");
      IO.writeLog(Data);
      //IO.w3call_LogTrackingInfo(pubAddress,pvtkey,Data,message,Hash);

    }
    else if(reqList[i][0]=="LUX") {
      GPS = sensor.GPSReading();
      Data = sensor.LightReading();
      Data.trackingNr = IO.getTrackingNr();
      Data.status = "Shipping";
      Data.Loc = GPS.Loc;
      IO.writeLog(Data);
      //IO.w3call_LogTrackingInfo(pubAddress,pvtkey,Data,message,Hash);
      //console.log(Data);
    }
  }
}

function watchContractEvents() {
  IO.w3Event_ShippingEvents();
}
module.exports.main = Main;
