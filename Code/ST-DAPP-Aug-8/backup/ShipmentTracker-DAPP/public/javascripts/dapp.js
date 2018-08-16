var web3;
var ABI;
var sTContract;
var shipmentTracker;
var contractAddress;
var arrayOfTrackingNrs=[];
var dataArr2 = [];
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
         //web3 =new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/OjKVgpoFhZHebfOVMumL"));
       }
       web3.eth.defaultAccount = web3.eth.accounts[0];
       console.log(web3.eth.defaultAccount);
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
          // console.log(result.args._shipper);

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
       //TODO:remove
       /*var errorEvent2 = shipmentTracker.AuthorizationError2();
       errorEvent2.watch(function(error,result){
         if(error) {
           console.log(error);
           $("#loader").hide();
         }
         else {
           $("#loader").hide();
           console.log(result);
         }
       });*/


  });


function acc_Select() {
    web3.eth.defaultAccount = $('#account-selected').val();
    document.getElementById('User Account').getElementsByTagName('span')[0].innerHTML = web3.eth.defaultAccount ;

  }

function getAccountsArr() {
  return web3.eth.accounts;
}

async function getHandlers() {
  //tODO:try catch to handle errors
  var size = await callContractFunc(shipmentTracker.getHandlerListlength);
  var arr=[];
  for(var index=0;index<size.c[0];index++)
  {
    var handler = await callContractFunc(shipmentTracker.getHandlerList,index);
    arr.push(handler);// TODO: use callbacks where ever necessary
  }
  return arr;
}


function callContractFunc(funcName,arg1) {
  if(typeof arg1 !== 'undefined') {
    return new Promise(function(resolve, reject) {
      funcName.call(arg1,function(error, response) {
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
      funcName.call(function(error, response) {
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
  var authorizedHandlers =  await getHandlers();
  console.log(authorizedHandlers);

  ($("#handlerTable tbody")).empty();
  handlerList = $('#handler-list');

    var index = 0;
  for(var i=0;i<authorizedHandlers.length;i++) {
      var result='';
      index++;
      result += '<tr>';
      result += '<td>'+ index +'</td>' ;
      result += '<td>'+ authorizedHandlers[i][0] +'</td>' ;
      result += '<td>'+ authorizedHandlers[i][1] +'</td>' ;
      result += '<td>'+ authorizedHandlers[i][2] +'</td>' ;
      result += '</tr>';
      ($("#handlerTable tbody")).append(result);

    }
    handlerList.show();
}

async function checkDuplicates(address) {
  var list = await getHandlers();
  for(var i=0;i<list.length;i++) {
    if(list[i][0]==address) {
      console.log("adress:" + list[i][0]);
      return false;
    }
  }
  return true;

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
  var address = $('#shHandlerAddress').val();
  var name =$('#shHandlerName').val();
  var pqKey=$('#shHandlerKey').val();
  $("#loader").show();
  console.log(web3.eth.defaultAccount);
  /*shipmentTracker.verifyDigitalSignature(address,hash3,name,{gas:300000},function(error,response){
    if(error) {
      alert(error);
    }
    else {
      //waitForTxToBeMined(response);
      alert("txhash is:"+response);
    }
  })*/

  if(checkEmpty('#shHandlerKey')) {
    var exists = await checkDuplicates(address);
    console.log("exists is:"+exists);
    if(web3.isAddress(address)&&exists) {
      console.log(web3.eth.defaultAccount);
      shipmentTracker.AuthorizeAddress(address,name,pqKey,{gas:300000},function(error,response){
        if(error) {
          alert(error + ' due to Invalid eth/PQ key');
          $("#loader").hide();
        }
        else {
          //waitForTxToBeMined(response);
          alert("txhash is:" + response);
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
  var address = $('#shHandlerAddress').val();
  $("#loader").show();
  var isExists = await checkDuplicates(address);
  console.log(!isExists);
  if(web3.isAddress(address)&&(!isExists)) {

    shipmentTracker.RevokeAuthorization(address,{gas:300000},function(error, result) {
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
    console.log(error);
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
    var data = {
      _shipperAddr:temp[0],
      _sensorData:temp[1].toNumber(),
      _dataID:temp[2],
      _status:temp[3],
      _currentLocation:temp[4],
      _blockNr:temp[5],
      _timeStamp:temp[6],
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
      result += '<td>'+ value._blockNr +'</td>' ;
      result += '<td>'+ value._timeStamp +'</td>' ;
      result += '<td>'+ value._shipperAddr +'</td>' ;
      result += '<td>'+ value._trackingNr +'</td>' ;
      result += '<td>'+ value._currentLocation +'</td>' ;
      result += '<td>'+ value._status +'</td>' ;
      result += '<td>'+ value._sensorData +'</td>' ;
      result += '<td>'+ value._dataID + '</td>';
      result += '<td>'+ "Violation Placeholder" + '</td>';
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
      result += '<td>'+ dataArr2[j]._blockNr +'</td>' ;
      result += '<td>'+ dataArr2[j]._timeStamp +'</td>' ;
      result += '<td>'+ dataArr2[j]._shipperAddr +'</td>' ;
      result += '<td>'+ dataArr2[j]._trackingNr +'</td>' ;
      result += '<td>'+ dataArr2[j]._currentLocation +'</td>' ;
      result += '<td>'+ dataArr2[j]._status +'</td>' ;
      result += '<td>'+ dataArr2[j]._sensorData +'</td>' ;
      result += '<td>'+ dataArr2[j]._dataID + '</td>';
      result += '<td>'+ "Violation Placeholder" + '</td>';
      result += '</tr>';
      ($("#packageTrackingTable tbody")).append(result);
    }
    else if($( "#selectStatus option:selected" ).text()=="Any") {
      var result='';
      result += '<tr>';
      //result += '<td>'+ index++ +'</td>' ;
      result += '<td>'+ dataArr2[j]._blockNr +'</td>' ;
      result += '<td>'+ dataArr2[j]._timeStamp +'</td>' ;
      result += '<td>'+ dataArr2[j]._shipperAddr +'</td>' ;
      result += '<td>'+ dataArr2[j]._trackingNr +'</td>' ;
      result += '<td>'+ dataArr2[j]._currentLocation +'</td>' ;
      result += '<td>'+ dataArr2[j]._status +'</td>' ;
      result += '<td>'+ dataArr2[j]._sensorData +'</td>' ;
      result += '<td>'+ dataArr2[j]._dataID + '</td>';
      result += '<td>'+ "Violation Placeholder" + '</td>';
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

function testLogging(message,hash,test) {
  console.log(web3.eth.defaultAccount);
  console.log(test);
  if(test=="1") {
    console.log("test 1:" + hash);
    shipmentTracker.LogTrackingInformation(25,"tempID1","darmstadt","07b323db","Shipping",message,hash,{gas:300000},function(error,response){
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
    shipmentTracker.LogTrackingInformation(25,"tempID1","germamy","08b323db","Shipping",message,hash,{gas:300000},function(error,response){
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
    shipmentTracker.LogTrackingInformation(30,"tempID3","berlin","07b323db","Shipping",message,hash,{gas:300000},function(error,response){
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
    shipmentTracker.LogTrackingInformation(-30,"tempID1","munich","07b323ee","Shipping",message,hash,{gas:300000},function(error,response){
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

}

function renderRaiden() {
  window.location="/home/channel"
}
