//import gpio from 'rpi-gpio';
function TempReading() {
  var dummySensorReading = {
      value:20,
      ID:"TEMP",
      //Loc:"Darmstadt"
  };
  return dummySensorReading;
}

function PressureReading() {
  var dummySensorReading = {
      value:621,
      ID:"PRESSURE",
      //Loc:"Darmstadt"
  };
  return dummySensorReading;
}

function LightReading() {
  var dummySensorReading = {
      value:50,
      ID:"LUX",
      //Loc:"Darmstadt"
  };
  return dummySensorReading;
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

module.exports.TempReading = TempReading;
module.exports.PressureReading = PressureReading;
module.exports.LightReading = LightReading;
module.exports.GPSReading = GPSReading;
