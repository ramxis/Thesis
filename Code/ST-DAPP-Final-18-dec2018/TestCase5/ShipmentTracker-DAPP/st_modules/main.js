var express = require('express');
var fs = require('fs');
var IO = require('./Utils.js');


const Test_Interval = 60;//60sec or 2 min

var message = "Zanbeel";
var reqList;
var pvtkey;
var board;
async function Main(pubaddress,password,datadir) {

  IO.Init(pubaddress);

  pvtkey = IO.getPvtKey(pubaddress,password,datadir);

  IO.setTrackingNr("07b323db");

  console.log('the tracking nr is:' + IO.getTrackingNr());


  PQ1="eff3bc952afdc46400bcfc07a5699f525119760f364cb04129323e207fcdc18c"
  PQ2="d6cea69138fa00da0fa2af65912191ad45b35a690150855e99c2f3c293334f85";

  IO.setIDPQkey("DHLDarmstadt1",PQ1);
  var Data = {
       value:621,
       ID:"Temp",
       Loc:"Darmstadt",
   };
   Data.status = "Shipping";

   console.log(Data.value,Data.ID,Data.Loc,Data.status);

/*  try
  {
    Interval = setInterval(function(){LogTrackingData(reqList,pubaddress,pvtkey,message);},Log_Interval*1000);
  }
  catch(err)
  {
    console.log(err);
  }*/
  try
  {
    Interval_test = setInterval(function(){IO.w3call_LogTrackingInfo(pubaddress,pvtkey,Data);},Test_Interval*1000);//write every 60 minutes local logs
  }
  catch(err)
  {
    console.log(err);
  }

  //setInterval(IO.web3CallLogTrackingInfo(pubAddress,pvtkey,Data), 50*1000)
}

module.exports.main = Main;