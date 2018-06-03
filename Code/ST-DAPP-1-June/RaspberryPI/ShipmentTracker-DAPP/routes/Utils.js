//all web3 related code goes here
var express = require('express');
var fs = require('fs');
var Web3 = require('web3');
var ABI;
var web3;
var contractAddress=fs.readFileSync(__dirname + '/../public/ABI/contract.txt','');
  //var x= web3.utils.randomHex(4);
  //x=x.substr(2,8);*/
  //console.log('random number is:' + x);

  function writeLog() {
    filePath = __dirname + '/../public/log/log.txt';
    fs.appendFile(filePath,'data',(err) => {
      if (err) throw err;
      console.log("The file was succesfully appended!");
    });
  }
  //setInterval(writeLog, 10*1000);

  function web3Init() {

      if(typeof web3!=='undefined') {
        console.log("if called");
         web3=new Web3(web3.currentProvider);
       }
      else {
        console.log('else called');
        web3 =new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));//FIXME:change to local geth or remote geth
      }
      web3.eth.defaultAccount = web3.eth.accounts[0];
      console.log(web3.eth.accounts[0]);

      ABI = JSON.parse(fs.readFileSync(__dirname + '/../public/ABI/ABI.json'));
      shipmentTracker  = web3.eth.contract(ABI).at(contractAddress.toString());
      var result = shipmentTracker.getHandlerListlength();
      return result;
      //var add = shipmentTracker.getHandlerList(0);

       /* // guide to use call back
       shipmentTracker.getInstructor(function(error, result) {
           if (!error) {
               //$("#instructor").html(result[0]+' ('+result[1]+' years old)');
               console.log('handler list size is: ');
               console.log(result[0]);
               console.log(result[1]);
           } else
                console.log(error);
       });*/


    /*  web3.eth.getAccounts().then(accounts => {

  })
     ABI=fs.readFileSync(__dirname + '/../public/ABI/ABI.json');
     var JsonABI=JSON.parse(ABI);
     shipmentTracker Contract = new web3.eth.Contract(JsonABI,contractAddress); //for web31.0.0 beta*/

  }



module.exports.contractAddress = contractAddress;
module.exports.writeLog = writeLog;
module.exports.web3Init = web3Init;
