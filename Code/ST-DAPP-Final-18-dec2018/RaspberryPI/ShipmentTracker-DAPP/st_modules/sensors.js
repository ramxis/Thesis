//import gpio from 'rpi-gpio';
var GrovePi = require('node-grovepi').GrovePi;
var Commands = GrovePi.commands;
var Board = GrovePi.board;
var UltrasonicDigitalSensor = GrovePi.sensors.UltrasonicDigital;
var AirQualityAnalogSensor = GrovePi.sensors.AirQualityAnalog;
var DHTDigitalSensor = GrovePi.sensors.DHTDigital;
var LightAnalogSensor = GrovePi.sensors.LightAnalog;
var DigitalButtonSensor = GrovePi.sensors.DigitalButton;
var RotaryAngleAnalogSensor = GrovePi.sensors.RotaryAnalog;
var LoudnessAnalogSensor = GrovePi.sensors.LoudnessAnalog;

var led = new GrovePi.sensors.DigitalOutput(3);
var dhtSensor = new DHTDigitalSensor(4, DHTDigitalSensor.VERSION.DHT11, DHTDigitalSensor.CELSIUS);
var toogle = false;
var IO = require('./Utils.js');
var pkg = require('./main.js');
var city;

PQ1="eff3bc952afdc46400bcfc07a5699f525119760f364cb04129323e207fcdc18c"
PQ2="d6cea69138fa00da0fa2af65912191ad45b35a690150855e99c2f3c293334f85";


function ButtonPress() {
  var buttonSensor = new DigitalButtonSensor(2)
          //Digital Port 2
          // Button sensor
          console.log('Digital Button Sensor (start watch)')
          buttonSensor.on('down', function (res) {
            //res will be either singlepress or longpress
            if(res=='longpress') {
              pkg.StopSensing();
            }
            else{
              if(toogle==false){
                toogle=true;
                IO.setIDPQkey("DHLDarmstadt2",PQ2);
              }
              else{
                toogle=false;
                IO.setIDPQkey("DHLDarmstadt1",PQ1);
              }
            }

            console.log('Button onDown, data=' + res)
          })
          buttonSensor.watch()
}

function TempSensor() {
  //var dhtSensor = new DHTDigitalSensor(4, DHTDigitalSensor.VERSION.DHT11, DHTDigitalSensor.CELSIUS);
  //await sleep(1000);
  console.log('DHT11 Sensor Temp Reading');
  var Temp = dhtSensor.read();
  var SensorReading = {
      value:Math.floor(Temp[0]),
      ID:"TEMP",
  };

  console.log(SensorReading);
  //dhtSensor.read();//two consective readings makes the second reading as garbage//this is added to make sure humid reads correct values
  return SensorReading;
}
function HumiditySensor() {

  console.log('starting Humidity Reading');
  var Temp = dhtSensor.read();
  if(Temp<0) {
    Temp = dhtSensor.read();//to get rid of garbage
  }
  var SensorReading = {
      value:Math.floor(Temp[1]),
      ID:"Humidity",
  };

  console.log(SensorReading);
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
   console.log(SensorReading);
   return SensorReading;
}

function SoundSensor() {
  var loudnessSensor = new LoudnessAnalogSensor(0);
  //Analog Port 2
//console.log('Loudness Analog Sensor (start monitoring - reporting results every 10s)');
  var reading = loudnessSensor.read();
  var SensorReading = {
      value:reading,
      ID:"dB",
  };
  console.log("loundess reading is",reading);
  return SensorReading;
}

function RotarySensor() {
  var rotaryAngleSensor = new RotaryAngleAnalogSensor(1)
          //Analog Port 1
          // Rotary Angle Sensor
          console.log('Rotary Angle Sensor (start watch)')
          rotaryAngleSensor.start()
          rotaryAngleSensor.on('data', function (res) {
            console.log('Rotary onData value =' + res)
            val = Math.floor(res/10);
            switch (val) {
              case 0:
                  city = "Berlin";
                  break;
              case 1:
                  city = "Munich";
                  break;
              case 2:
                  city = "Amsterdam";
                  break;
              case 3:
                  city = "Frankfurt";
                  break;
              case 4:
                  city = "Darmstadt";
                  break;
              case 5:
                  city = "Hamburg";
                  break;
              case 6:
                  city = "Paris";
                  break;
              case 7:
                  city = "London";
                  break;
              case 8:
                  city = "Lahore";
                  break;
              case 9:
                  city = "Koln";

            }
          })
}

function GPSReading() {
  console.log("loc is",city);
  var dummySensorReading = {
      Logitude:50,
      Latitutde:100,
      ID:"LOC",
      Loc:city
  };
  return dummySensorReading;
}

module.exports.SoundSensor = SoundSensor;
module.exports.TempSensor = TempSensor;
module.exports.PressureReading = PressureReading;
module.exports.HumiditySensor = HumiditySensor;
module.exports.LightSensor = LightSensor;
module.exports.GPSReading = GPSReading;
module.exports.ButtonPress = ButtonPress;
module.exports.RotarySensor = RotarySensor;