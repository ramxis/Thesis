//all web3 related code goes here
var express = require('express');
var fs = require('fs');
var Web3 = require('web3');
var EthereumTx = require('ethereumjs-tx');
var keythereum = require("keythereum");
const IPFS = require('ipfs-api');
var moment = require('moment');
var ipfsLogPath;
var ipfs;
var web3;
var trackingNr;
var TXCount;
var shipmentTracker;
var shipmentTrackerEvents;
//var web3Events;


var contractAddress=fs.readFileSync(__dirname + '/../public/ABI/contract.txt','');
var ABI = JSON.parse(fs.readFileSync(__dirname + '/../public/ABI/ABI.json'));
trackingNr = fs.readFileSync(__dirname + '/../public/log/trNr.txt');
  //console.log(ipfs);
  function Init(pubAddress) {
    if(typeof web3!=='undefined') {
       web3=new Web3(web3.currentProvider);
     }
    else {
      //web3 =new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
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
    //QmawkdpbSJ8toLWNnziaomUP8ZJvB6JfxiuSBffD9pNmJZ Qmb3AijbZARp514EbUQn5SWvQQN4WwbRA65t69tdmoVB3K
    ipfs.files.cat('QmWejs7GybHfHVz66ddUk5AhqSq7zFnJgoRMLPQmTnCRbt', function (err, file) {//TODO:remove
      if (err) {
        throw err;
      }
      console.log("file contents are :");
      console.log(file.toString('utf8'));
    });


    /*ipfs.files.stat('/log/test7.txt', function(err, stats) {
      if (err)
      {
        throw err;
      }
      else
      {
        console.log('IPFS file hash: ' + stats.hash);
        //const bytesOffset = stats.size+1;
        console.log('IPFS file size: ' + stats.size);
      }
    });*/

    //init IPFS and temp Log dir
    ipfsLogPath = '/log/' + trackingNr.toString() + '.txt';

    const data = "Initializing Sensor and Shipping data logging for package Nr. " + trackingNr.toString() + "\n";
    const buffer = Buffer.from(data);

    ipfs.files.write('/log/test8.txt',buffer,{create:true}, function(err) {
      if(err)
      {
        console.log('IPFS error:' + err);
      }
      console.log("IPFS log Init");
    });


  }

  async function writeLogIPFS() {
    console.log("writing to IPFS:");
    const filePath = __dirname + '/../public/log/' + trackingNr.toString() + '.txt';
    const data = fs.readFileSync(filePath);
    console.log(data);
    var ipfsLogHash = w3call_GetHash(trackingNr);// retuns null or 0 if hash not set;

    if(!ipfsLogHash)
    { // if package is still in transit
      console.log("IPFS path is:" + ipfsLogPath.toString());
      ipfs.files.stat('/log/test8.txt', function(err, stats) {
        if (err)
        {
          throw err;
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
    console.log(web3.eth.blockNumber);
    Data.shipperAddress = web3.eth.defaultAccount;
    //Data.BlockNr = web3.eth.blockNumber;
    Data.TimeStamp = moment().format('MMMM Do YYYY, h:mm:ss a');
    var loglLine = Data.shipperAddress + ' ' + Data.value + ' ' + Data.ID + ' ' + Data.status + ' ' + Data.Loc + ' ' + Data.BlockNr + ' ' + Data.TimeStamp + "\n";
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


  //setInterval(writeLog, 10*1000);

  function getPvtKey(pubaddress,password,datadir)
  {
    console.log("getpvt key called");
    var keyObject = keythereum.importFromFile(pubaddress, datadir);
    privateKey = keythereum.recover(password, keyObject);
    return privateKey;
  }

  function w3Event_ShippingEvents()
  {
    console.log("Shipping Event called" + web3Events.eth.defaultAccount);

    /*var event = shipmentTracker.ShippingEvent();

// watch for changes
event.watch(function(error, result){
  if(error) {
    console.log(error);
  }
  else {

    console.log("Shipping Event: " + result);
    console.log("Shipping Event: " + result.args._shipper);
    console.log("Shipping Event: " + result.args._trackingNr);
  }
});*/
  /*shipmentTracker.ShippingEvent({},function(error,result){

      if(error) {
        console.log(error);
      }
      else {

        console.log("Shipping Event: " + result);
        console.log("Shipping Event: " + result.args._shipper);
        console.log("Shipping Event: " + result.args._trackingNr);
      }
    });*/
    console.log("Shipping Event called");
    shipmentTrackerEvents.events.ShippingEvent((error, event) => {
      if (error) {
        console.error(error);
        return false;
      }
      //console.log(event);
      console.log(event.returnValues);
      console.log(event.returnValues._data);
      console.log(event.returnValues._datatID);
      console.log(event.returnValues._location);
      console.log(event.returnValues._trackingNr);
      console.log(event.returnValues._status);
      console.log("Returned Values");
    })

    console.log("Shipping Event called");


  }

function w3call_GetHash(trackingNr)
{
  //logic to get IPFS hash of full log for a given TrackingNr
  return false;
}
function w3call_SetIPFSHash(trackingNr,ipfsHash)
{

}
function package_Delivered(trackingNr)
{
  //set final ipfs hash for trackingNr
  //event fires when ipfs hash is set for trackingNr, make sure it can only be set once
  //master nodes listens for setIPFS hash message
  //on event setipfs hassh master node calls StopTacking() logic // make handler list, violations etc permanent i.e immutable for this particular trackingNr;

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


function w3call_LogTrackingInfo(pubAddress,privateKey,Data,Message,Signature)
{

      web3.eth.defaultAccount = pubAddress;
      console.log(web3.eth.defaultAccount);

      const funcAbi = shipmentTracker.LogTrackingInformation.getData(Data.value,Data.ID,Data.Loc,Data.trackingNr,Data.status,Message,Signature);

      console.log(Data.value,Data.ID,Data.Loc,Data.trackingNr,Data.status);
      //var estimatedGas;
      var nonce;
      var estimatedGas = web3.eth.estimateGas({
        to: contractAddress.toString(),
        data: funcAbi
      });
      console.log(estimatedGas)
      //var gasPrice = web3.eth.getGasPrice().then(function(data){console.log(data)});
      //console.log(gasPrice.toString(10));

      /*shipmentTracker.methods.LogTrackingInformation(Data.value,Data.ID,Data.Loc,Data.trackintgNr,Data.status).estimateGas({from: pubAddress})
      .then(function(gasAmount){
          console.log(gasAmount);
      })
      .catch(function(error){
          console.log(error);
      });*/

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
          TXCount = _nonce;
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

              web3.eth.sendRawTransaction('0x' + serializedTx.toString('hex'),function(err, hash) {
                if (!err){
                  console.log("TX hash is:" + hash);
                }

              });
            }

          });

      //const funcAbi = shipmentTracker.LogTrackingInformation(Data.value,Data.ID,Data.Loc,Data.trackingNr,Data.status,Message,Signature).encodeABI();//web31.0
      //const LogTrackingInformationFunc = shipmentTracker.LogTrackingInformation(Data.value,Data.ID,Data.Loc,Data.trackingNr,Data.status,Data.status,Message,Signature);//web31.0
      /*LogTrackingInformationFunc({from: pubAddress}).then((gasAmount) => {
        estimatedGas = gasAmount.toString(16);
        console.log("Estimated gas: " + estimatedGas);
        //calculating nonce
        web3.eth.getTransactionCount(pubAddress).then(_nonce => {
            nonce = _nonce.toString(16);
            console.log("Nonce: " + nonce);
            //preparing tx json
            const txParams = {
              gasPrice: '0x09184e72a000',
              gasLimit: 3000000,
              to: contractAddress.toString(),
              data: funcAbi,
              from: pubAddress,
              nonce: '0x' + nonce
            };
            //serialize tx
            const tx = new Tx(txParams);
            tx.sign(privateKey);
            const serializedTx = tx.serialize();

            web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('receipt', receipt => {
              console.log(receipt);
              contract.methods.get().call().then(v => console.log("Value after increment: " + v));

            });

          });

      });*/

      //return result;
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
function tempHash(message)
{
  return web3.sha3(message);
}

module.exports.getTrackingNr = getTrackingNr;
module.exports.setTrackingNr = setTrackingNr;
module.exports.writeLogIPFS = writeLogIPFS;
module.exports.contractAddress = contractAddress;
module.exports.writeLog = writeLog;
module.exports.w3call_LogTrackingInfo = w3call_LogTrackingInfo;
module.exports.getPvtKey = getPvtKey;
module.exports.w3call_GetRequirements = w3call_GetRequirements;
module.exports.Init = Init;
module.exports.w3Event_ShippingEvents = w3Event_ShippingEvents;
module.exports.tempHash = tempHash;
