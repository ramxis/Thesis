var web3;
var ABI;
var sTContract;
var shipmentTracker;
var contractAddress;
var arrayOfTrackingNrs=[];
var dataArr2 = [];
var ipfs;
/*var shipmentData = {
  _shipperAddr,
  _sensorData,
  _dataID,
  _currentLocation
}*/
//getABI();
$(document).ready(function() {
      console.log("script loaded");
      $('[data-toggle="tooltip"]').tooltip();
      //console.log(top.contractAddress);
      if(typeof web3!=='undefined') {
        console.log("if called");
         web3=new Web3(web3.currentProvider);

       }
      else {
         web3 =new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));//FIXME:change to local geth or remote geth
        // web3 =new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/OjKVgpoFhZHebfOVMumL"));
       }
       web3.eth.defaultAccount = web3.eth.accounts[0];
       console.log(web3.eth.defaultAccount);
       console.log("web3 version is:" + web3.version.api);
       var ethArray = getAccountsArr();
       var drop_list='';
       for(var i=0;i<ethArray.length;i++) {
          drop_list  += '<option value="'+ ethArray[i] + '">' + ethArray[i] + '</option>';

       }

       accList = $('#account-selected');
       accList.html('');
       accList.append(drop_list);
       document.getElementById('User Account').getElementsByTagName('span')[0].innerHTML = web3.eth.defaultAccount ;
       getABI();
       sTContract = web3.eth.contract(ABI);
       contractAddress = document.getElementById("contract-address").firstChild.data;
       shipmentTracker = sTContract.at(contractAddress);
       //call back for new shipper address authorization
       var addressAuthorizeEvent = shipmentTracker.AuthorizeAddressEvent();
       addressAuthorizeEvent.watch(function(error,result){
         if(error) {
           alert(error);
           $("#loader").hide();
         }
         else {
           $("#loader").hide();
           console.log(result);
         }
       });

       //call back new tracking Event
       var shipmentTrackingEvent = shipmentTracker.ShippingEvent();
       shipmentTrackingEvent.watch(function(error,result){
         if(error) {
           alert(error);
           $("#loader").hide();
         }
         else {
           $("#loader").hide();
          console.log(result.args);

         }
       });

       //populate tracking numbers array
       var logTrackingNrs = shipmentTracker.NewTrackingNumber();
       logTrackingNrs.watch(function(error,result){
         if(error) {
           alert(error);
         }
         else {
           arrayOfTrackingNrs.push(result.args.trackingNr);
           //console.log(result.args.trackingNr);
         }
       });

       //call back AuthorizationError Event
       var errorEvent = shipmentTracker.AuthorizationError();
       errorEvent.watch(function(error,result){
         if(error) {
           alert(error);
           $("#loader").hide();
         }
         else {
           $("#loader").hide();
           alert(result);
         }
       });


       var ViolationEventMM = shipmentTracker.ReqViolationEventMinMax();
       ViolationEventMM.watch(function(error,result){
         if(error) {
           console.log("ReqViolationEventMinMax: " + error);
         }
         else {
           console.log("ReqViolationEventMinMax: " , result);
         }
       });

       var ViolationEventMax = shipmentTracker.ReqViolationEventMax();
       ViolationEventMax.watch(function(error,result){
         if(error) {
           console.log("ReqViolationEventMax: " + error);
         }
         else {
           console.log("ReqViolationEventMax: " , result);
         }
       });

       var ViolationEventMin = shipmentTracker.ReqViolationEventMin();
       ViolationEventMin.watch(function(error,result){
         if(error) {
           console.log("ReqViolationEventMin: " + error);
         }
         else {
           console.log("ReqViolationEventMin: " , result);
         }
       });

        ipfs = new Ipfs({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
         ipfs.once('ready', () => {
           console.log('Online status: ', ipfs.isOnline() ? 'online' : 'offline')
           ipfs.files.cat('QmQzCQn4puG4qu8PVysxZmscmQ5vT1ZXpqo7f58Uh9QfyY', function (err, data) {
           if (err) {
             return console.error('Error - ipfs files cat', err, res)
           }

           console.log(data.toString())
         });
         ipfs.id().then(i => console.log(i));

           // You can write more code here to use it. Use methods like
           // node.files.add, node.files.get. See the API docs here:
           // https://github.com/ipfs/interface-ipfs-core
         });


  });


function acc_Select() {
    web3.eth.defaultAccount = $('#account-selected').val();
    document.getElementById('User Account').getElementsByTagName('span')[0].innerHTML = web3.eth.defaultAccount ;

  }

function getAccountsArr() {
  return web3.eth.accounts;
}

async function getHandlers(TrNr) {
  //tODO:try catch to handle errors
  var size = await callContractFunc(shipmentTracker.getHandlerListlength,TrNr);
  var arr=[];
  for(var index=0;index<size.c[0];index++)
  {
    var handler = await callContractFunc(shipmentTracker.getHandlerList,TrNr,index);
    arr.push(handler);// TODO: use callbacks where ever necessary
  }
  return arr;
}


function callContractFunc(funcName,TrNr,index) {
  if(typeof index !== 'undefined') {
    return new Promise(function(resolve, reject) {
      funcName.call(index,TrNr,function(error, response) {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      })
    });
  }
  else {
    return new Promise(function(resolve, reject) {
      funcName.call(TrNr,function(error, response) {
        if (error) {
          reject(error);
        } else {
          resolve(response);
        }
      })
    });
  }

}

async function appendHandlerList() {
  try {
        //var authorizedHandlers=[];
        ($("#handlerTable tbody")).empty();
        var TrackingNrs = await getArrayOfTrNr();
        var size = await getTrackingNrSize();//ignore:error
        handlerList = $('#handler-list');
        var index = 0;
        for(var i=0;i<size.c[0];i++) {
          console.log(TrackingNrs[i]);
          var Handler =  await getHandlers(TrackingNrs[i]);
          console.log(Handler)
          index=appendHandlerTable(Handler,index,TrackingNrs[i])
          //++index;
        }

        handlerList.show();
  }
  catch(error) {
          console.log('error is:',error);
  }

}

function appendHandlerTable(Handler,index,TrackingNr) {
  //handlerList = $('#handler-list');

  for(var i=0;i<Handler.length;i++) {
      var result='';
      ++index;
      console.log('index',index);
      result += '<tr>';
      result += '<td>'+ index +'</td>' ;
      result += '<td>'+ sanitize(TrackingNr) +'</td>' ;
      result += '<td>'+ sanitize(Handler[i][1]) +'</td>' ;//show shipper name first
      result += '<td>'+ sanitize(Handler[i][0]) +'</td>' ;//show eth adress of pkg tracker second
      result += '<td>'+ sanitize(Handler[i][2]) +'</td>' ;
      result += '</tr>';
      ($("#handlerTable tbody")).append(result);

    }
    return index;
}

function sanitize(data) {
  //to protect against cross site scripting
  if (typeof(data) === 'string') {
    return data.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }
  else {
    return data;
  }


}

async function checkDuplicates(address,TrNr) {
  var list = await getHandlers(TrNr);
  for(var i=0;i<list.length;i++) {
    if(list[i][0]==address) {
      console.log("adress:" + list[i][0]);
      return false;
    }
  }
  return true;

}

async function getArrayOfTrNr() {
  arrayOfTrackingNrs=[];
  var size = await getTrackingNrSize();
  console.log(size.c[0]);

  for (var j=0;j<size.c[0];j++) {
    var pkgNr = await getTrackingNr(j);
    arrayOfTrackingNrs.push(pkgNr);
  }
  return arrayOfTrackingNrs;
}

function clearText(id) {
  document.getElementById(id).value="";
}

function checkEmpty(id) {
  var value=$(id).val();

  if(value=="")
  {
    return false;
  }
  return true;
}

async function addNewHandler() {
  try {

    var address = $('#shHandlerAddress').val();
    var name =$('#shHandlerName').val();
    var pqKey=$('#shHandlerKey').val();
    var TrNr = $('#shTrackingNr').val();
    $("#loader").show();
    console.log(web3.eth.defaultAccount);
    if(checkEmpty('#shHandlerKey')) {
      //var exists = await checkDuplicates(address,TrNr);
      //console.log("exists is:"+exists);
      //if(web3.isAddress(address)&&exists) {
      if(web3.isAddress(address)) {
        console.log(web3.eth.defaultAccount);
        shipmentTracker.AuthorizeAddress(address,name,pqKey,TrNr,{gas:300000},function(error,response){
          if(error) {
            alert(error + ' due to Invalid eth/PQ key');
            $("#loader").hide();
          }
          else {
            //waitForTxToBeMined(response);
            alert("txhash is:" + response);
            //$("#loader").hide();
          }

        })
        //TODO:handle the case when non owner calls this, in remix this becomes gas estimation error
      }
      else {
        $("#loader").hide();
        $('#shHandlerAddress').val('Invalid / duplicate key for required field');
      }
    }
    else {
      $("#loader").hide();
      $('#shHandlerKey').val('Invalid/Duplicate address');
    }

  }
  catch(error) {
    console.log(error);
    $("#loader").hide();
  }


}

 function waitForTxToBeMined (txHash) {
   let txReceipt
   while (!txReceipt) {
   try {
      txReceipt = web3.eth.getTransactionReceipt(txHash,function(error,response) {
        if (error) {
          alert(error);
        } else {
          console.log(response);
          //$("#loader").hide();
        }
     });
   }
   catch (err) {
     console.log(err)
    }
  }
}

async function removeHandler() {
  try {

    var address = $('#shHandlerAddress').val();
    var TrNr = $('#shTrackingNr').val();
    $("#loader").show();
    var isExists = await checkDuplicates(address,TrNr);
    console.log(!isExists);
    if(web3.isAddress(address)&&(!isExists)) {

      shipmentTracker.RevokeAuthorization(address,TrNr,{gas:300000},function(error, result) {
        if(error) {
          alert(error);
        }
        else {
          $("#loader").hide();
          if(result) {
            alert(address + " removed from authorized package handlers");
           }
          appendHandlerList();
        }
      });
    }
    else {
      $('#shHandlerAddress').val('Invalid/Adress not Found!');
      $("#loader").hide();
    }

  }
  catch(error) {
    console.log(error);
    $("#loader").hide();
  }

}


async function showShipmentTracking() {
  try {
        console.log("func called");
        $("#loader-1").show();
        ($("#packageTrackingTable tbody")).empty();
        arrayOfTrackingNrs=[];
        var tableData;
         var size = await getTrackingNrSize();//ignore:error
         console.log(size.c[0]);
        for (var j=0;j<size.c[0];j++) {
          var pkgNr = await getTrackingNr(j) ;
          arrayOfTrackingNrs.push(pkgNr);
        }
        console.log(arrayOfTrackingNrs);
        for(var i=0;i<arrayOfTrackingNrs.length;i++) {
          tableData = getLogDataByTrackingNr(arrayOfTrackingNrs[i]);
          appendToPkgTrackingTable(tableData);
        }

        $("#loader-1").hide();
  }
  catch(error) {
    alert(error);
    $("#loader-1").hide();
  }

}


function getTrackingNrSize() {
  return new Promise(function(resolve, reject) {
    shipmentTracker.getPkgNrListSize.call(function(error, response) {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    })
  });
}

function getTrackingNr(index) {
  return new Promise(function(resolve, reject) {
    shipmentTracker.getAllPkgNrs.call(index,function(error, response) {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    })
  });
}

async function getLogDataByTrackingNr(_trackingNr) {
  var dataArr = [];
  var size= await getLogSizebyTrNr(_trackingNr);
  for(var i=0;i<size.c[0];i++) {
    var temp = await getLoggedData(i,_trackingNr)
    console.log("Data is: ",temp);
    var data = {
      _shipperAddr:temp[0], //this is IoT address
      _shipperID:temp[1],
      _sensorData:temp[2].toNumber(),
      _dataID:temp[3],
      _currentLocation:temp[4],
      _status:temp[5],
      _blockNr:temp[6],
      _timeStamp:temp[7],
      _trackingNr:_trackingNr
    };
    data._timeStamp=formatTime(data._timeStamp);
    dataArr2.push(data);
    dataArr.push(data);
  }
  return dataArr;
}

function getLogSizebyTrNr(_trackingNr) {
  return new Promise(function(resolve, reject) {
    shipmentTracker.GetLogSize.call(_trackingNr,function(error, response) {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    })
  });
}

function getLoggedData(index,_trackingNr) {
  return new Promise(function(resolve, reject) {
    shipmentTracker.GetLoggedData.call(index,_trackingNr,function(error, response) {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    })
  });
}

function appendToPkgTrackingTable(data) {
  data.then(res=>{
    console.log("result is:" + res);
    var result='';
    $.each(res,function(index,value){
      result += '<tr>';
      //result += '<td>'+ index++ +'</td>' ;
      result += '<td>'+ sanitize(value._blockNr) +'</td>' ;
      result += '<td>'+ sanitize(value._timeStamp) +'</td>' ;
      result += '<td>'+ sanitize(value._shipperID) +'</td>' ;
      result += '<td>'+ sanitize(value._shipperAddr) +'</td>' ;
      result += '<td>'+ sanitize(value._trackingNr) +'</td>' ;
      result += '<td>'+ sanitize(value._currentLocation) +'</td>' ;
      result += '<td>'+ sanitize(value._status) +'</td>' ;
      result += '<td>'+ sanitize(value._sensorData) +'</td>' ;
      result += '<td>'+ sanitize(value._dataID) + '</td>';
      result += '<td>'+ sanitize("Violation Detected") + '</td>';
      //FIXME:put this back in if necessary result += '<td>'+ "Action Placeholder" + '</td>';
      //var td = '<button id="btn" name="btn">close channel</button>'
      result += '</tr>';
    });
    ($("#packageTrackingTable tbody")).append(result);

  })


}

function updatePkgTrackingTable() {
  ($("#packageTrackingTable tbody")).empty();
  for(var j=0;j<dataArr2.length;j++) {
    if(dataArr2[j]._status==$( "#selectStatus option:selected" ).text()) {
      var result='';
      result += '<tr>';
      //result += '<td>'+ index++ +'</td>' ;
      result += '<td>'+ sanitize(dataArr2[j]._blockNr) +'</td>' ;
      result += '<td>'+ sanitize(dataArr2[j]._timeStamp) +'</td>' ;
      result += '<td>'+ sanitize(dataArr2[j]._shipperID) +'</td>' ;
      result += '<td>'+ sanitize(dataArr2[j]._shipperAddr) +'</td>' ;
      result += '<td>'+ sanitize(dataArr2[j]._trackingNr) +'</td>' ;
      result += '<td>'+ sanitize(dataArr2[j]._currentLocation) +'</td>' ;
      result += '<td>'+ sanitize(dataArr2[j]._status) +'</td>' ;
      result += '<td>'+ sanitize(dataArr2[j]._sensorData) +'</td>' ;
      result += '<td>'+ sanitize(dataArr2[j]._dataID) + '</td>';
      result += '<td>'+ sanitize("Violation Placeholder") + '</td>';
      result += '</tr>';
      ($("#packageTrackingTable tbody")).append(result);
    }
    else if($( "#selectStatus option:selected" ).text()=="Any") {
      var result='';
      result += '<tr>';
      //result += '<td>'+ index++ +'</td>' ;
      result += '<td>'+ sanitize(dataArr2[j]._blockNr) +'</td>' ;
      result += '<td>'+ sanitize(dataArr2[j]._timeStamp) +'</td>' ;
      result += '<td>'+ sanitize(dataArr2[j]._shipperID) +'</td>' ;
      result += '<td>'+ sanitize(dataArr2[j]._shipperAddr) +'</td>' ;
      result += '<td>'+ sanitize(dataArr2[j]._trackingNr) +'</td>' ;
      result += '<td>'+ sanitize(dataArr2[j]._currentLocation) +'</td>' ;
      result += '<td>'+ sanitize(dataArr2[j]._status) +'</td>' ;
      result += '<td>'+ sanitize(dataArr2[j]._sensorData) +'</td>' ;
      result += '<td>'+ sanitize(dataArr2[j]._dataID) + '</td>';
      result += '<td>'+ sanitize("Violation Placeholder") + '</td>';
      result += '</tr>';
      ($("#packageTrackingTable tbody")).append(result);
    }

  }

}
function SetRequirements() {
  var trackingNR = $('#trID').val();
  var rID = $('#reqID').val();
  var rtitle = $('#req-title').val();
  var rMinThreshold = $('#req-min').val();
  var rMaxThreshold = $('#req-max').val();
  var sevLevel = $('#sevLevel').val();
  switch(sevLevel) {
    case "Low":
    sevLevel = 1;
    break;
    case "Medium":
    sevLevel = 2;
    break;
    case "High":
    sevLevel = 3;
    break;
    case "Critical":
    sevLevel = 4;
    break;
  }
  var minFlag = $('#MinCheck').is(':checked');
  var maxFlag = $('#MaxCheck').is(':checked');
  $("#loader-2").show();
  console.log(web3.eth.defaultAccount);
  console.log(Number(sevLevel));
 //shipmentTracker.SetRequirements.sendTransaction("08b254ff","tempIDMM","Temperature",4,-25,120,true,true,{gas:300000},function(error, result) {
  shipmentTracker.SetRequirements(trackingNR,rID,rtitle,Number(sevLevel),rMinThreshold,rMaxThreshold,minFlag,maxFlag,{gas:300000},function(error, result) {
    if(error) {
      alert(error);
    }
    else {
      $("#loader-2").hide();
      alert("txhash is:"+ result);
      window.location="/home";
      //return false;
    }
  });
return false;


/*shipmentTracker.methods.AuthorizeAddress("0x89d72e87b7b10b194a7d2d0b76da7bf6fa774d7a").send({from:web3.eth.defaultAccount},{gas:300000})
.on('transactionHash', function(hash){
    alert("txhash is:"+hash);
})
.on('receipt', function(receipt){
    alert("txreceipt is:" + receipt);
})
.on('confirmation', function(confirmationNumber, receipt){
    console.log("tx confirmation is:"+receipt);
})
.on('error', console.error);*/


  //window.location="/home";
  //return false;
}

async function getRequirementsByID(_reqID) {
  var reqObj = await callContractFunc(shipmentTracker.GetRequirementObject,_reqID);
  return reqObj;

}

async function getAllRequirements() {
  var reqID = "tempID";

}

function formatTime(timeStamp) {
  time = new Date(timeStamp*1000);
  return time.toUTCString();
}

/*function isExists(address) {
  return !(checkDuplicates(address));
}*/

function getABI() {
       //TODO:may need to replace it with synchronous ajax call instead,
       //REASON:if we are changing contractABI from login page, getABI() might be run before switch to home
       $.ajax({
             type: "GET",
             url: './ABI/ABI.json',
             async: false,
             success : function(data) {
                 ABI = data;
             }
         });
}

function test() {
  /*console.log('Online status: ', ipfs.isOnline() ? 'online in Test' : 'offline');
  ipfs.id().then(i => console.log(i));
  testIPFS();
  var ipfs = new Ipfs({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
  //QmawkdpbSJ8toLWNnziaomUP8ZJvB6JfxiuSBffD9pNmJZ Qmb3AijbZARp514EbUQn5SWvQQN4WwbRA65t69tdmoVB3K
  ipfs.files.cat('QmTa2LGez4nrtaW9dZJ8hMNKrcnFHXzYHryt1pN2bYE7Vf', function (err, file) {
    //TODO:remove
    if (err) {
      throw err;
    }
    console.log("file contents are :");
    console.log(file.toString('utf8'));
  });
  */
  var address = $('#shHandlerAddress').val();
  var name =$('#shHandlerName').val();
  var pqKey=$('#shHandlerKey').val();
  $("#loader").show();
  console.log(web3.version);
  //var solidityhash = web3.utils.soliditySha3(name);
  //console.log('solidityhash is:' + solidityhash);
  var hash3 = web3.sha3(name);
  console.log('hash3 is:' + hash3);
  console.log("bytes 32 sig is:" + hash3);




  testLogging(name,hash3,pqKey);

}

async function testIPFS() {
  var data = await testIPFSbyTrNr();
  console.log('data is : ' + data);
}

function testIPFSbyTrNr() {
  return new Promise(function(resolve, reject) {
    ipfs.files.cat('QmTa2LGez4nrtaW9dZJ8hMNKrcnFHXzYHryt1pN2bYE7Vf',function(error, response) {
      if (error) {
        reject(error);
      } else {
        resolve(response);
      }
    })
  });
}

function testLogging(message,hash,test) {
  console.log(web3.eth.defaultAccount);
  console.log(test);
  if(test=="1") {
    console.log("test 1:" + hash);
    shipmentTracker.LogTrackingInformation(2500,"TEST","darmstadt","07b323db","Shipping",message,hash,{gas:300000},function(error,response){
      if(error) {
        alert(error + ' due to Invalid eth/PQ key');
        $("#loader").hide();
      }
      else {
        //waitForTxToBeMined(response);
        alert("txhash is:" + response);
        $("#loader").hide();
      }

    })
  }
  else if(test=="2") {
    console.log("test 2:" + hash);
    shipmentTracker.LogTrackingInformation(250,"TEMP","germamy","07b323db","Shipping",message,hash,{gas:300000},function(error,response){
      if(error) {
        alert(error + ' due to Invalid eth/PQ key');
        $("#loader").hide();
      }
      else {
        //waitForTxToBeMined(response);
        alert("txhash is:" + response);
        $("#loader").hide();
      }

    })
  }
  else if(test=="3"){
    console.log("test 3:" + hash);
    shipmentTracker.LogTrackingInformation(30,"TEMP","berlin","08b323db","Shipping",message,hash,{gas:300000},function(error,response){
      if(error) {
        alert(error + ' due to Invalid eth/PQ key');
        $("#loader").hide();
      }
      else {
        //waitForTxToBeMined(response);
        alert("txhash is:" + response);
        $("#loader").hide();
      }

    })
  }
  else if(test=="4") {
    console.log("test 4:" + hash);
    shipmentTracker.LogTrackingInformation(-30,"TEMP","munich","07b323db","Shipping",message,hash,{gas:300000},function(error,response){
      if(error) {
        alert(error + ' due to Invalid eth/PQ key');
        $("#loader").hide();
      }
      else {
        //waitForTxToBeMined(response);
        alert("txhash is:" + response);
        $("#loader").hide();
      }

    })
  }
  else if(test=="5") {
    console.log("test failure:" + hash);
    shipmentTracker.LogTrackingInformation(-30,"tempID5","munich","07b323ee","Shipping",message,hash+message,{gas:300000},function(error,response){
      if(error) {
        console.log(error);
        $("#loader").hide();
      }
      else {
        //waitForTxToBeMined(response);
        alert("txhash is:" + response);
        $("#loader").hide();
      }

    })
  }
  else if(test=="6") {
    console.log("test xss:" + hash);
    shipmentTracker.LogTrackingInformation(-30,"tempID5","munich","07b323ee","<script>console.log(web3.eth.defaultAccount)</script>",message,hash,{gas:300000},function(error,response){
      if(error) {
        alert(error + ' due to Invalid eth/PQ key');
        $("#loader").hide();
      }
      else {
        //waitForTxToBeMined(response);
        alert("txhash is:" + response);
        $("#loader").hide();
      }

    })
  }

}

function renderRaiden() {
  window.location="/home/channel"
}