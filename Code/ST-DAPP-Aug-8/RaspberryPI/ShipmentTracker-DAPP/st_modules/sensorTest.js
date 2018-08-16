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


var board;


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

// catches ctrl+c event
process.on('SIGINT', onExit)

function TempReading() {
  board = new Board({
      debug: true,
      onError: function(err) {
        console.log('Something wrong just happened');
        console.log(err);
      },
  onInit: function(res) {
    if (res) {
      console.log('GrovePi Version :: ' + board.version());
      var dhtSensor = new DHTDigitalSensor(4, DHTDigitalSensor.VERSION.DHT11, DHTDigitalSensor.CELSIUS)
      // Digital Port 4
      // DHT Sensor
      console.log(dhtSensor);
      console.log('DHT Digital Sensor (start watch)');
      /*dhtSensor.on('change', function (res) {
        console.log('DHT temp value= ', res[0],'Humidity Vaule = ',res[1]);
      })*/
      dhtSensor(function(res) {
        console.log('DHT continues value=' + res)
      })
      dhtSensor.watch(1000) // milliseconds
    }
  }
})
board.init();
}

function PressureReading() {
  var dummySensorReading = {
      value:621,
      ID:"PRESSURE",
      //Loc:"Darmstadt"
  };
  return dummySensorReading;
}
function init(pubAddress,password,datadir) {
  board.init();
}
function LightReading() {
  /*var dummySensorReading = {
      value:50,
      ID:"LUX",
  };
  return dummySensorReading;*/
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
        /*var sensor_value = Math.log(res);
        var lux = Math.exp((res)/80.0);*/
        console.log('Light Analog Sensor (start watch)');
        lightSensor.on('change', function(res) {
        //console.log(' Resistance value = ' + res);
	      /*var sensor_value = Math.pow(res,-0.71)*(62.77);
          var lux = Math.pow(res,-1.43)*(350);
          var sensor_value2 = Math.pow((res/1000),-0.71)*(62.77);*/
	      var res_ohm = res*1000;
        //var lux = 1790093.712*(Math.pow(res_ohm,-0.97));
	      var lux = 1787793.712*(Math.pow(res_ohm,-0.97));//1747793.712*(Math.pow(res_ohm,-0.96688)); >450 is direct sunlight
        console.log(' Lux value = '+lux);

        })
        lightSensor.watch(1000);
      }
    }
  })
  //board.init();
}

function close() {
  console.log('ending');
  board.close();
  process.removeAllListeners();
  if (typeof err != 'undefined')
    console.log(err);
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
module.exports.init = init;
module.exports.close = close;
module.exports.TempReading = TempReading;
module.exports.PressureReading = PressureReading;
module.exports.LightReading = LightReading;
module.exports.GPSReading = GPSReading;
