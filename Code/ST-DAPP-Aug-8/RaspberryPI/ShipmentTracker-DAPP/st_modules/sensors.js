var express = require('express');
var fs = require('fs');
var IO = require('./Utils.js');
var PQ = require('./pqHash.js');
var GrovePi = require('node-grovepi').GrovePi;
var Commands = GrovePi.commands;
var Board = GrovePi.board;
var UltrasonicDigitalSensor = GrovePi.sensors.UltrasonicDigital;
var DHTDigitalSensor = GrovePi.sensors.DHTDigital;
var LightAnalogSensor = GrovePi.sensors.LightAnalog;
var DigitalButtonSensor = GrovePi.sensors.DigitalButton;
var led = new GrovePi.sensors.DigitalOutput(3);

const Log_Interval = 60;//60sec or 2 min
const IPFS_Interval = Log_Interval*Log_Interval; //60min or 1h
var message = "Zanbeel";
var reqList;
var pvtkey;
var board;
async function Main(pubaddress,password,datadir) {

  IO.Init(pubaddress);

  pvtkey = IO.getPvtKey(pubaddress,password,datadir);

  IO.setTrackingNr("07b323db");

  console.log('the tracking nr is:' + IO.getTrackingNr());

  reqList = await IO.w3call_GetRequirements(IO.getTrackingNr());
  console.log(reqList);
  PQ1="eff3bc952afdc46400bcfc07a5699f525119760f364cb04129323e207fcdc18c"
  PQ2="d6cea69138fa00da0fa2af65912191ad45b35a690150855e99c2f3c293334f85";

  IO.setIDPQkey("DHLDarmstadt1",PQ1);
  SensorReading(reqList,pubaddress);

  /*try
  {
    Interval = setInterval(function(){LogTrackingData(reqList,pubaddress,pvtkey,message);},Log_Interval*1000);
  }
  catch(err)
  {
    console.log(err);
  }*/
  try
  {
    Interval_ipfs = setInterval(function(){IO.writeLogIPFS();},IPFS_Interval*1000);//write every 60 minutes local logs
  }
  catch(err)
  {
    console.log(err);
  }
  try
  {
    Interval_hash = setInterval(function(){IO.w3call_SetIpfsHash(trackingNr,pubAddress,privateKey);},4*IPFS_Interval*1000);//save ipfs log hash every 4 hours
  }
  catch(err)
  {
    console.log(err);
  }

  //setInterval(IO.web3CallLogTrackingInfo(pubAddress,pvtkey,Data), 50*1000)
}
function GPSReading() {
  var dummySensorReading = {
      Logitude:50,
      Latitutde:100,
      ID:"LOC",
      Loc:"Darmstadt"
  };
  return dummySensorReading;
}
function PressureReading(req,pubAddress) {
  var dummySensorReading = {
      value:621,
      ID:"PRESSURE",
      //Loc:"Darmstadt"
  };
  return dummySensorReading;
}

function SensorReading(reqList,pubAddress) {
  board = new Board({
    debug: true,
    onError: function(err) {
      console.log('Something wrong just happened');
      console.log(err);
    },
    onInit: function(res) {
      if (res) {
        console.log('GrovePi Version :: ' + board.version());
        for(var i=0;i<reqList.length;i++) {
          if(reqList[i][0]=="TEMP") {
            var req=reqList[i];
            console.log('Inializing Temp sensor');
            var dhtSensor = new DHTDigitalSensor(4, DHTDigitalSensor.VERSION.DHT11, DHTDigitalSensor.CELSIUS);
            console.log('DHT11 Sensor');
            dhtSensor.on('change', function(res) {
              var SensorReading = {
                  value:res[0],
                  ID:"TEMP",
              };
              //console.log(SensorReading);
              LogTrackingData(req,pubAddress,pvtkey,message,SensorReading);
            })
            dhtSensor.watch(10*1000);//every 10 secs TODO:change to log_interval
          }
          else if(reqList[i][0]=="PRESSURE") {
            console.log('Inializing Pressure sensor');
            PressureReading(reqList[i],pubaddress);
          }
          else if(reqList[i][0]=="LUX") {
            var req=reqList[i];
            console.log('Inializing Light sensor');
            var lightSensor = new LightAnalogSensor(2);
            lightSensor.on('change', function(res) {
            var res_ohm = res*1000;
            //var lux = 1790093.712*(Math.pow(res_ohm,-0.97));
            var lux = 1787793.712*(Math.pow(res_ohm,-0.97));//1747793.712*(Math.pow(res_ohm,-0.96688)); >450 is direct sunlight
            console.log(' Lux value = '+lux);
            var SensorReading = {
                value:lux,
                ID:"LUX",
            };
            LogTrackingData(req,pubAddress,pvtkey,message,SensorReading);
            })
            lightSensor.watch(10*1000);//every 10 secs
          }
          else if(reqList[i][0]=="HUMIDITY") {
            var req=reqList[i];
            console.log('Inializing Humidity sensor');
            var humSensor = new DHTDigitalSensor(4, DHTDigitalSensor.VERSION.DHT11, DHTDigitalSensor.CELSIUS);
            humSensor.on('change', function(res) {
              var SensorReading = {
                  value:res[1],
                  ID:"HUMIDITY",
              };

              LogTrackingData(req,pubAddress,pvtkey,message,SensorReading);
            })
            humSensor.watch(120*1000);//every 120 secs TODO:change to log_interval
          }
          else if(reqList[i][0]=="TID") {
            var req=reqList[i];
            console.log('Inializing Test sensor',req);
            var lightSensor2 = new LightAnalogSensor(2);
            lightSensor2.on('change', function(res) {
            var res_ohm = res*1000;
            //var lux = 1790093.712*(Math.pow(res_ohm,-0.97));
            var lux = 1787793.712*(Math.pow(res_ohm,-0.97));//1747793.712*(Math.pow(res_ohm,-0.96688)); >450 is direct sunlight
            console.log(' Dummy Sensor value = '+lux);
            var SensorReading = {
                value:lux,
                ID:"TID",
            };
            console.log('req sensor is' , req[0]);
            LogTrackingData(req,pubAddress,pvtkey,message,SensorReading);
            })
            lightSensor2.watch(10*1000);//every 120 secs
          }

        }


      }

    }//init ends here

  })//board ends here

  board.init();

}


function LogTrackingData(reqList,pubAddress,pvtkey,message,data) {
  /*console.log('reading is ',data);
  console.log(reqList);
  console.log('pubAddress is' , pubAddress);
  console.log('pvtkey is ', pvtkey);*/
  //for(var i=0;i<reqList.length;i++) {
    var Data;
    var GPS;
    //get all sensors data and then send tx with await, so no violation is missed as we wait earlier tx to be mined
    if(reqList[0]=="TEMP") {
      GPS = GPSReading();
      Data = data;
      Data.trackingNr = IO.getTrackingNr();
      Data.status = "Shipping";//TODO:getStatus() // based on slong and latitude
      Data.Loc = GPS.Loc;
      //var Hash=IO.tempHash(message);
      IO.writeLog(Data);
      chkViolations(Data,reqList,pubAddress,pvtkey);//chk violations
      //IO.w3call_LogTrackingInfo(pubAddress,pvtkey,Data,message,Hash);//send a running average every 6 hrs etc

    }
    else if(reqList[0]=="PRESSURE") {
      GPS = GPSReading();
      Data = data;
      Data.trackingNr = IO.getTrackingNr();
      Data.status = "Shipping";
      Data.Loc = GPS.Loc;
      //var Hash=IO.tempHash(message);
      console.log("pressure called");
      IO.writeLog(Data);
      chkViolations(Data,reqList,pubAddress,pvtkey);//chk violations

    }
    else if(reqList[0]=="LUX") {
      GPS = GPSReading();
      Data = data;
      Data.trackingNr = IO.getTrackingNr();
      Data.status = "Shipping";
      Data.Loc = GPS.Loc;
      //var Hash=IO.tempHash(message);
      IO.writeLog(Data);
      chkViolations(Data,reqList,pubAddress,pvtkey);//chk violations
      //console.log(Data);
    }
    else if(reqList[0]=="TID") {
      console.log("TID Called", reqList);
      GPS = GPSReading();
      Data = data;
      Data.trackingNr = IO.getTrackingNr();
      Data.status = "Shipping";
      Data.Loc = GPS.Loc;
      //var Hash=IO.tempHash(message);
      //console.log("Data is ",Data);
      IO.writeLog(Data);
      chkViolations(Data,reqList,pubAddress,pvtkey);//chk violations
    }
  //}
}

function chkViolations(sensorData,Req,pubAddress,pvtkey) {
  //console.log(Req);
  console.log('requirement is:',Req[0],Req[2].toNumber(),Req[3].toNumber(),Req[4].toNumber());
  console.log('Violation check', sensorData.value,sensorData.ID);
  if(sensorData.ID==Req[0]) {
    var req = {
      _minValue:Req[3].toNumber(),
      _maxValue:Req[4].toNumber(),
      _minFlag:Req[5],
      _maxFlag:Req[6]
    }
   //console.log('req',req);
    if(req._minFlag&&req._maxFlag) {

      if((req._minValue<sensorData.value)&&(sensorData.value<req._maxValue)) {
        console.log('Passed',sensorData.value,req._maxValue);
      }
      else {
        console.log('MinMAX');
        IO.w3call_LogTrackingInfo(pubAddress,pvtkey,sensorData);
      }
      /*if {

        IO.w3call_LogTrackingInfo(pubAddress,pvtkey,sensorData,message,Hash);
      }*/

    }

    else if((!req._minFlag)&&(req._maxFlag)) {

      if(sensorData.value>req._maxValue) {
        console.log('MAX');
        IO.w3call_LogTrackingInfo(pubAddress,pvtkey,sensorData);
      }

    }

    else if((req._minFlag)&&(!req._maxFlag)) {

      if(sensorData.value<req._minValue) {
        console.log('Min');
        IO.w3call_LogTrackingInfo(pubAddress,pvtkey,sensorData);
      }

    }
  }


}

function onExit(err) {
  console.log('ending')
  board.close();
  process.removeAllListeners();
  process.exit();
  if (typeof err != 'undefined')
    console.log(err)
}

// catches ctrl+c event
process.on('SIGINT', onExit)

module.exports.main = Main;
/*function LightReading(req,pubAddress) {

  console.log('starting Light Sensor LM358');

  var board = new Board({
    debug: true,
    onError: function(err) {
      console.log('Something wrong just happened');
      console.log(err);
    },
    onInit: function(res) {
      if (res) {
        console.log('GrovePi Version :: ' + board.version());
        var lightSensor = new LightAnalogSensor(2);
        console.log('Light Analog Sensor (start watch)');
        lightSensor.on('change', function(res) {

	      var res_ohm = res*1000;
        //var lux = 1790093.712*(Math.pow(res_ohm,-0.97));
	      var lux = 1787793.712*(Math.pow(res_ohm,-0.97));//1747793.712*(Math.pow(res_ohm,-0.96688)); >450 is direct sunlight
        console.log(' Lux value = '+lux);
        var SensorReading = {
            value:lux,
            ID:"LUX",
        };
        LogTrackingData(req,pubAddress,pvtkey,message,SensorReading);
        })
        lightSensor.watch(10*1000);//every 10 secs
      }
    }
  })
  board.init();
}*/
