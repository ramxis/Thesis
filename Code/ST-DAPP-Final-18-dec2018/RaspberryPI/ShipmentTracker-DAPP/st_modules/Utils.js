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
  function Init(pubAddress) {
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

    //IPFS INIT
    ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
    //QmawkdpbSJ8toLWNnziaomUP8ZJvB6JfxiuSBffD9pNmJZ Qmb3AijbZARp514EbUQn5SWvQQN4WwbRA65t69tdmoVB3K QmQzCQn4puG4qu8PVysxZmscmQ5vT1ZXpqo7f58Uh9QfyY
    // QmdYr9BpKoBQdo9uDgNUFAvNM2uKTavB7B1JKE5vs4MDLu
    ipfs.files.cat('Qmf6Du3g89hXadeycuJbY9rsxcq8QUuL1RGhiU2rJjts6k', function (err, file) {//TODO:remove
      if (err) {
        console.log(err);
        throw err;
      }
      console.log("IPFS log:");
      console.log(file.toString('utf8'));
    });


    /*ipfs.files.stat('/log/atest1.txt', function(err, stats) {
      if (err)
      {
        console.log("Stat error", err);
      }
      else
      {
        console.log('IPFS file hash: ' + stats.hash);
        //const bytesOffset = stats.size+1;
        console.log('IPFS file size: ' + stats.size);
      }
    });*/

    //init IPFS and temp Log dir
    /*ipfsLogPath = '/log/' + trackingNr.toString() + '.txt';

    const data = "Initializing Sensor and Shipping data logging for package Nr." + trackingNr.toString() + "\n";
    const buffer = Buffer.from(data,'utf-8');

    ipfs.files.write('/log/btest1.txt', Buffer.from(data,'utf-8'),{create:true}, function(err) {
      if(err)
      {
        console.log('IPFS write error:' + err);
        console.log(buffer);
        console.log('/log/btest1.txt');
      }
      console.log("IPFS log Init");
    });*/



  }

  async function writeLogIPFS() {
    console.log("writing to IPFS:");
    const filePath = __dirname + '/../public/log/' + trackingNr.toString() + '.txt';
    const data = fs.readFileSync(filePath);
    console.log(data);
    ipfsLogHash = w3call_GetIpfsHash(trackingNr);// retuns null or 0 if hash not set;
    console.log("IpFS:",ipfsLogHash)
    if(!ipfsLogHash)
    { // if package is still in transit
      console.log("IPFS path is:" + ipfsLogPath.toString());
      ipfs.files.stat('/log/test18.txt', function(err, stats) {
        if (err)
        {
          console.log("stat error", err);
        }
        else
        {
          console.log('IPFS file hash: ' + stats.hash);
          //const bytesOffset = stats.size+1;
          console.log('IPFS file size: ' + stats.size);
          ipfs.files.write('/log/test8.txt', data, {create:true,offset:stats.size}, function (err) {
            if(err)
            {
              console.log('IPFS error:' + err);
            }
            console.log("log appended");
            fs.unlink(filePath, (err) => {
              if (err)
              {
                  console.log("failed to delete local image:"+err);
              }
              else
              {
                  console.log('successfully deleted local log');
              }

            });

          });//ipfs.files.write ends here
        }

      });
    }

  }

  function writeLog(Data)
  {
    const filePath = __dirname + '/../public/log/' + trackingNr.toString() + '.txt';
    //console.log(web3.eth.blockNumber);
    Data.shipperAddress = web3.eth.defaultAccount;
    Data.BlockNr = web3.eth.blockNumber;
    Data.TimeStamp = moment().format('MMMM Do YYYY, h:mm:ss a');
    var loglLine = Data.BlockNr + ' ' + Data.TimeStamp + ' ' + shipperID + ' ' + Data.shipperAddress + ' '  + ' ' + Data.status + ' ' + Data.Loc + ' ' + Data.value + ' ' + Data.ID +  "\n"; // add shipper id
    fs.appendFile(filePath,loglLine,(err) => {
        if (err) throw err;
    });

    console.log("writing to temp Log:");

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



function w3call_GetIpfsHash(trackingNr)
{
  //logic to get IPFS hash of full log for a given TrackingNr
  console.log("Tracking Nr:",trackingNr.toString());
  var ipfsAddress = shipmentTracker.getIpfsAddress(trackingNr.toString());
  return ipfsAddress;
}


function w3call_SetIpfsHash(trackingNr,pubAddress,privateKey)
{
  console.log('Writting IPFS hash to Smart Contract:');
  console.log('IPFS hash is:' + ipfsLogHash[0].hash);
  web3.eth.defaultAccount = pubAddress;
  const funcAbi = shipmentTracker.setIpfsAddress.getData(ipfsLogHash[0].hash,trackingNr);
  //var estimatedGas;
  var nonce;
  var estimatedGas = web3.eth.estimateGas({
    to: contractAddress.toString(),
    data: funcAbi
  });
  console.log("Getting gas estimate");
  console.log("Estimated gas: " + estimatedGas);
  var _nonce = web3.eth.getTransactionCount(pubAddress);
  //nonce = _nonce.toString(16);
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
        gasLimit:'0x' + estimatedGas,
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
          //stopFlag = 1;
          logging.gracefulClose();
        }
        else {
          console.log(err);
        }

      });
    }

  });
}

function package_Delivered(pubkey,pvtkey)
{
  //set final ipfs hash for trackingNr
  //event fires when ipfs hash is set for trackingNr, make sure it can only be set once
  //master nodes listens for setIPFS hash message
  //on event setipfs hassh master node calls StopTacking() logic // make handler list, violations etc permanent i.e immutable for this particular trackingNr;
  console.log("writing to IPFS:");
  const filePath = __dirname + '/../public/log/' + trackingNr.toString() + '.txt';
  console.log("local filepath: " + filePath);
  const data = fs.readFileSync(filePath);
  ipfs.files.add(data, function (err, data) {
    if (err) {
      console.log(err);
    }
    console.log("IPFS hash: ", data[0]);
    console.log('Writting IPFS hash');
    ipfsLogHash = data;
    w3call_SetIpfsHash(trackingNr.toString(),pubkey,pvtkey);
    //return data;TODO:check return? or check first if without async works
    fs.unlink(filePath, (err) => {
      if (err)
      {
          console.log("failed to delete local image:",err);
      }
      else
      {
          console.log('successfully deleted local log');
      }
    });
  });


}
 async function w3call_GetRequirements(trackingNr)
 {

    console.log(contractAddress.toString());
    console.log("web3 version is:" + web3.version.api);
    console.log(web3.eth.defaultAccount);
    var reqList=[];
    //var _reqSize= await shipmentTracker.methods.GetReqListSize(trackingNr).call();//web3 1.0.0
    var _reqSize = shipmentTracker.GetReqListSize(trackingNr);
    console.log(_reqSize.toNumber());
    for(var i=0;i<_reqSize.toNumber();i++){
      //var _reqObject = await shipmentTracker.methods.GetRequirementObject(i,trackingNr).call();//web3 1.0.0
      var _reqObject = shipmentTracker.GetRequirementObject(i,trackingNr);
      reqList.push(_reqObject);
    }
    return reqList;

  }
  function setIDPQkey(ID,shipperPvtKey) {
    PQKey=shipperPvtKey;
    shipperID=ID;
  }

async function w3call_LogTrackingInfo(pubAddress,privateKey,Data)
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
      const funcAbi = shipmentTracker.LogTrackingInformationNew.getData(Data.value,Data.ID,Data.Loc,Data.trackingNr,Data.status,shipperID,signature,_seed);
      //const funcAbi = shipmentTracker.LogTrackingViolations.getData(Data.value,Data.ID,Data.Loc,Data.trackingNr,Data.status,shipperID,signature,_seed);

      //encrypted PQ logic
      console.log(Data.value,Data.ID,Data.Loc,Data.trackingNr,Data.status,shipperID,signature,_seed);
      console.log("---------------Encrypted args below-------------------");
      console.log(cData.value,cData.ID,cData.Loc,cData.trackingNr,cData.status,shipperID,signature,_seed);
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

  function getHandlerListlength()
  {
    return new Promise(function(resolve, reject) {
    shipmentTracker.methods.getHandlerListlength.call(function(error, response) {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    })
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
module.exports.writeLogIPFS = writeLogIPFS;
module.exports.setIDPQkey = setIDPQkey;
module.exports.contractAddress = contractAddress;
module.exports.writeLog = writeLog;
module.exports.w3call_LogTrackingInfo = w3call_LogTrackingInfo;
module.exports.getPvtKey = getPvtKey;
module.exports.w3call_GetRequirements = w3call_GetRequirements;
module.exports.Init = Init;
module.exports.w3call_GetIpfsHash = w3call_GetIpfsHash;
module.exports.w3call_SetIpfsHash = w3call_SetIpfsHash;
module.exports.ipfsLogHash = ipfsLogHash;
module.exports.package_Delivered = package_Delivered;
module.exports.tempHash = tempHash;
