//import gpio from 'rpi-gpio';
var GrovePi = require('node-grovepi').GrovePi;
var Commands = GrovePi.commands;
var Board = GrovePi.board;
var UltrasonicDigitalSensor = GrovePi.sensors.UltrasonicDigital;
var AirQualityAnalogSensor = GrovePi.sensors.AirQualityAnalog;
var DHTDigitalSensor = GrovePi.sensors.DHTDigital;
var LightAnalogSensor = GrovePi.sensors.LightAnalog;
var DigitalButtonSensor = GrovePi.sensors.DigitalButton;
var led = new GrovePi.sensors.DigitalOutput(3);
var dhtSensor = new DHTDigitalSensor(4, DHTDigitalSensor.VERSION.DHT11, DHTDigitalSensor.CELSIUS);




function TempSensor() {
  //var dhtSensor = new DHTDigitalSensor(4, DHTDigitalSensor.VERSION.DHT11, DHTDigitalSensor.CELSIUS);
  console.log('DHT11 Sensor Temp Reading');
  var Temp = dhtSensor.read();
  var SensorReading = {
      value:Math.floor(Temp[0]),
      ID:"TEMP",
  };
  //console.log("Temp full:",Temp);
  //board.close();
  //may be read temp requirement from a file ?
  //then perform chkviolations
  //call violations function from contract
  console.log(SensorReading);
  //dhtSensor.read();//two consective readings makes the second reading as garbage//this is added to make sure humid reads correct values
  return SensorReading;
}
function HumiditySensor() {
  console.log('starting Humidity Reading');
  //console.log('GrovePi Version :: ' + board.version());
  //var dhtSensor = new DHTDigitalSensor(4, DHTDigitalSensor.VERSION.DHT11, DHTDigitalSensor.CELSIUS);
  var Temp = dhtSensor.read();
  var SensorReading = {
      value:Math.floor(Temp[1]),
      ID:"Humidity",
  };
  //board.close();
  //may be read temp requirement from a file ?
  //then perform chkviolations
  //call violations function from contract
  //console.log("Hum full:",Temp);
  console.log(SensorReading);
  //dhtSensor.read();
  return SensorReading;

}
function PressureReading() {
  var dummySensorReading = {
      value:621,
      ID:"PRESSURE",
      //Loc:"Darmstadt"
  };
  return dummySensorReading;
}

 function LightSensor() {
   var lightSensor = new LightAnalogSensor(2);
   console.log('Light Analog Sensor');
   var res = lightSensor.read();
   var res_ohm = res*1000;
   var lux = 1787793.712*(Math.pow(res_ohm,-0.97));//1747793.712*(Math.pow(res_ohm,-0.96688)); >450 is direct sunlight
   var SensorReading = {
       value:Math.floor(lux),
       ID:"LUX",
   };
   //board.close();
   //may be read temp requirement from a file ?
   //then perform chkviolations
   //call violations function from contract
   console.log(SensorReading);
   return SensorReading;
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

module.exports.TempSensor = TempSensor;
module.exports.PressureReading = PressureReading;
module.exports.HumiditySensor = HumiditySensor;
module.exports.LightSensor = LightSensor;
module.exports.GPSReading = GPSReading;