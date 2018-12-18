//all web3 related code goes here
var express = require('express');
var fs = require('fs');
var Web3 = require('web3');
//var w3 = require('web3-providers-ws')
var EthereumTx = require('ethereumjs-tx');
var keythereum = require("keythereum");
const IPFS = require('ipfs-api');
var moment = require('moment');
const crypto = require('crypto');
var ipfsLogPath;
var ipfs;
var web3;
var trackingNr;
var TXCount;
var shipmentTracker;
var shipmentTrackerEvents;
var ipfsLogHash;
var PQKey;
var shipperID;
var logging = require('./main.js');


var contractAddress=fs.readFileSync(__dirname + '/../public/ABI/contract.txt','');
var ABI = JSON.parse(fs.readFileSync(__dirname + '/../public/ABI/ABI.json'));
trackingNr = fs.readFileSync(__dirname + '/../public/log/trNr.txt');
  //console.log(ipfs);
  function Init(pubAddress)
  {
    if(typeof web3!=='undefined') {
       web3=new Web3(web3.currentProvider);
     }
    else {
      //web3=new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
      web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/OjKVgpoFhZHebfOVMumL"));
      //web3Events = new web33(new web33.providers.WebsocketProvider('ws://ropsten.infura.io/ws'));

      //web3Events = new web33(new web33.providers.WebsocketProvider('wss://ropsten.infura.io/ws'));
      // /web3Events = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/OjKVgpoFhZHebfOVMumL"));

    }
    //shipmentTracker  = new web3.eth.Contract(ABI,contractAddress.toString());//web3 1.0.0
    shipmentTracker = web3.eth.contract(ABI).at(contractAddress.toString());
    web3.eth.defaultAccount = pubAddress;
    /*shipmentTrackerEvents = web3Events.eth.contract(ABI).at(contractAddress.toString());
    web3Events.eth.defaultAccount = pubAddress;*/
    TXCount=0;





  }





  function getTrackingNr()
  {
    trackingNr = fs.readFileSync(__dirname + '/../public/log/trNr.txt');
    return trackingNr.toString();
  }

  function setTrackingNr(_trackingNr)
  {
    filePath = __dirname + '/../public/log/trNr.txt';
    fs.writeFileSync(filePath,_trackingNr,(err) => {
      if (err) throw err;
      console.log("Tracking Nr was stored!");
    });
  }


  function getPvtKey(pubaddress,password,datadir)
  {
    console.log("getpvt key called");
    var keyObject = keythereum.importFromFile(pubaddress, datadir);
    privateKey = keythereum.recover(password, keyObject);
    return privateKey;
  }






  function setIDPQkey(ID,shipperPvtKey) {
    PQKey=shipperPvtKey;
    shipperID=ID;
  }

function w3call_LogTrackingInfo(pubAddress,privateKey,Data)
{
      console.log("Sending Violations to Smart Contract");
      web3.eth.defaultAccount = pubAddress;
      console.log(web3.eth.defaultAccount);

      console.log('PQ key:',PQKey);
      //console.log('ShipperID:',shipperID);

      const buf = crypto.randomBytes(32);
	    var _seed = buf.toString('hex');
      var signature = calcSig(_seed,PQKey);
      console.log("Signature:",signature);
      console.log("Seed:",_seed)
      //var cData = encryptArg(Data);
      var cData = encryptArg(Data,_seed,PQKey);

      //console.log(w3.utils.hexToBytes(Signature));
      //TODO:change this back if find any errors

      //const funcAbi = shipmentTracker.LogTrackingViolations.getData(Data.value,Data.ID,Data.Loc,Data.trackingNr,Data.status,shipperID,signature,_seed);

      //encrypted PQ logic
      console.log(Data.value,Data.ID,Data.Loc,trackingNr.toString(),Data.status,shipperID,signature,_seed);
      console.log("---------------Encrypted args below-------------------");
      console.log(cData.value,cData.ID,cData.Loc,trackingNr.toString(),cData.status,shipperID,signature,_seed);
      const funcAbi = shipmentTracker.LogTrackingInformationNew.getData(Data.value,Data.ID,Data.Loc,trackingNr.toString(),Data.status,shipperID,signature,_seed);

      //const funcAbi = shipmentTracker.LogTrackingViolations.getData(cData.value,cData.ID,cData.Loc,cData.trackingNr,cData.status,shipperID,signature,_seed);

      var nonce;

      var estimatedGas = web3.eth.estimateGas({
        from:pubAddress,
        to: contractAddress.toString(),
        data: funcAbi
      });



      console.log("Getting gas estimate");
      console.log("Estimated gas: " + estimatedGas);
        //calculating nonce
        var _nonce = web3.eth.getTransactionCount(pubAddress);

        if(TXCount==0)
        {
            TXCount = _nonce;
            console.log("TXCount:" + TXCount);
        }
        else
        {
            if(_nonce==TXCount)
            {
              _nonce=_nonce+1;
              TXCount=_nonce;
              console.log("Updated TXCount:" + TXCount);
            }
            else if(_nonce<TXCount)
            {
                _nonce=TXCount+1;
                TXCount=_nonce;
                console.log("Update TXCount:" + TXCount);
            }
        }

          nonce = _nonce.toString(16);
          console.log("Nonce: " + nonce);
          console.log("TXCount is=:" + TXCount);
          TXCount = _nonce;//nonce = _nonce.toString(16);
          web3.eth.getGasPrice(function(error,_gasprice) {
            if(error)
            {
              console.log('gas price error' + error);
            }
            else
            {
              console.log("gas Price: " + _gasprice);
              //var gp = web3.utils.numberToHex(_gasprice)//web31.0
              var gp = web3.toHex(_gasprice);
              console.log("gas price in hex:" + gp);
              //preparing tx json
              const txParams = {
                gasPrice:gp,
                gasLimit:'0x' + estimatedGas,//4500000
                //gasLimit: '0x27100',
                to:contractAddress.toString(),
                data:funcAbi,
                from:pubAddress,
                nonce:'0x' + nonce
              };
              //serialize tx
              const tx = new EthereumTx(txParams);
              tx.sign(privateKey);
              const serializedTx = tx.serialize();
              //console.log("sTX:",serializedTx)
              web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'),function(err, hash) {
                if (!err){
                  console.log("TX hash is:" + hash);
                }
                else {
                  console.log(err);
                }

              });
            }

          });
  }



function encryptArg(Data,_seed,_PQKey) {
  var enc_Data=Object.create(Data);
  //var b = web3.sha3(_seed + _seed);
  var b = web3.sha3(_PQKey,_seed);
  enc_Data.value = Data.value ^ web3.toDecimal(b);
  enc_Data.ID = web3.toDecimal(web3.fromAscii(Data.ID))^web3.toDecimal(b);
  enc_Data.Loc = web3.toDecimal(web3.fromAscii(Data.Loc))^web3.toDecimal(b);
  enc_Data.status = web3.toDecimal(web3.fromAscii(Data.status))^web3.toDecimal(b);
  return enc_Data;
}

function calcSig(seed,pvtkey) {
  var sig = web3.sha3(seed + pvtkey);
  return sig;
}

function tempHash(message)
{
  return web3.sha3(message);
}

module.exports.getTrackingNr = getTrackingNr;
module.exports.setTrackingNr = setTrackingNr;
module.exports.setIDPQkey = setIDPQkey;
module.exports.contractAddress = contractAddress;
module.exports.w3call_LogTrackingInfo = w3call_LogTrackingInfo;
module.exports.getPvtKey = getPvtKey;
module.exports.Init = Init;
module.exports.tempHash = tempHash;
