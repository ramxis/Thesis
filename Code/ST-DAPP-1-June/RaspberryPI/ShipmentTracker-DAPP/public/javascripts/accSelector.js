var web3;
var ABI;
var sTContract;
var shipmentTracker;
var contractAddress;
var arrayOfTrackingNrs=[];
/*var shipmentData = {
  _shipperAddr,
  _sensorData,
  _dataID,
  _currentLocation
}*/
//getABI();
$(document).ready(function() {
      console.log("script loaded");
      //console.log(top.contractAddress);
      if(typeof web3!=='undefined') {
        console.log("if called");
         web3=new Web3(web3.currentProvider);
       }
      else {
         web3 =new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));//FIXME:change to local geth or remote geth
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
         }
       });

       //call back new tracking Event
       var shipmentTrackingEvent = shipmentTracker.ShimpentTrackingEvent();
       shipmentTrackingEvent.watch(function(error,result){
         if(error) {
           alert(error);
           $("#loader").hide();
         }
         else {
           $("#loader").hide();
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
           console.log(result.args.trackingNr);
         }
       });


  });

function acc_Select() {
    web3.eth.defaultAccount = $('#account-selected').val();
    document.getElementById('User Account').getElementsByTagName('span')[0].innerHTML = web3.eth.defaultAccount ;

  }

function getAccountsArr() {
  return web3.eth.accounts;
}

function getHandlers() {
  var size=shipmentTracker.getHandlerListlength().c[0];
  var arr=[];

  for(var index=0;index<size;index++)
  {
    arr.push(shipmentTracker.getHandlerList(index));// TODO: use callbacks where ever necessary
  }
  return arr;
}

function appendHandlerList() {
  var authorizedHandlers = getHandlers();
  handlerList = $('#handler-list');
  handlerList.html('');
  for(var i=0;i<authorizedHandlers.length;i++) {
    handlerList.append("<p><b>"+i+":"+authorizedHandlers[i]+"</b></p>");
    handlerList.show();
  }
}

function checkDuplicates(address) {
  var authorizedHandlers = getHandlers();
  if(authorizedHandlers.lastIndexOf(address)==-1) {
    return true;
  }
  return false;
}

function clearText(id) {
  //$('#stContract').val("");
  document.getElementById(id).value="";
}

function addNewHandler() {
  var address = $('#shHandlerAddress').val();
  $("#loader").show();
  if(web3.isAddress(address)&&checkDuplicates(address)) {

    //shipmentTracker.AuthorizeAddress(address,);
    shipmentTracker.AuthorizeAddress(address);
    //TODO:handle the case when non owner calls this, in remix this becomes gas estimation error
  }
  else {
    $("#loader").hide();
    $('#shHandlerAddress').val('Invalid/Duplicate address');

  }
}

function removeHandler() {
  var address = $('#shHandlerAddress').val();
  $("#loader").show();
  if(web3.isAddress(address)&&isExists(address)) {

    shipmentTracker.RevokeAuthorization(address,function(error, result) {
      if(error) {
        alert(error);
      }
      else {
        $("#loader").hide();
        appendHandlerList();
      }
    });
  }
  else {
    $('#shHandlerAddress').val('Invalid/Duplicate address');
    $("#loader").hide();
  }
}

function showShipmentTracking() {
  //arrayOfTrackingNrs=shipmentTracker.getAllPkgNrs();
  console.log("func called");
  $("#loader-1").show();
  ($("#packageTrackingTable tbody")).empty();
  arrayOfTrackingNrs=[];
  var tableData;
  for (var j=0;j<shipmentTracker.getPkgNrListSize();j++) {
    arrayOfTrackingNrs.push(shipmentTracker.getAllPkgNrs(j));
  }
  console.log(arrayOfTrackingNrs);
  for(var i=0;i<arrayOfTrackingNrs.length;i++) {
    tableData = getLogDataByTrackingNr(arrayOfTrackingNrs[i]);
    appendToPkgTrackingTable(tableData);

  }
  $("#loader-1").hide();

  //shipmentTracker.
  //GetLoggedData(index,trackingNr);

  /*var size=shipmentTracker.GetLogSize().c[0];
  var arr=[];
  for(var index=0;index<size;index++)
  {
    arr.push(shipmentTracker.GetLoggedData(index));// TODO: use callbacks where ever necessary
  }
  console.log(arr[0][0],arr[0][1].c[0]);
  return arr;*/
}

function getLogDataByTrackingNr(_trackingNr) {
  var dataArr = [];
  var size=shipmentTracker.GetLogSize(_trackingNr).c[0];
  for(var i=0;i<size;i++) {
    var temp = shipmentTracker.GetLoggedData(i,_trackingNr);

    var data = {
      _shipperAddr:temp[0],
      _sensorData:temp[1].toNumber(),
      _dataID:temp[2],
      _currentLocation:temp[3],
      _blockNr:temp[4],
      _timeStamp:temp[5],
      _trackingNr:_trackingNr
    };
    data._timeStamp=formatTime(data._timeStamp);
    dataArr.push(data);
  }
  console.log(dataArr);
  return dataArr;
}

function appendToPkgTrackingTable(data) {
  var result='';
  $.each(data,function(index,value){
    result += '<tr>';
    result += '<td>'+ index +'</td>' ;
    result += '<td>'+ value._blockNr +'</td>' ;
    result += '<td>'+ value._timeStamp +'</td>' ;
    result += '<td>'+ value._shipperAddr +'</td>' ;
    result += '<td>'+ value._trackingNr +'</td>' ;
    result += '<td>'+ value._currentLocation +'</td>' ;
    result += '<td>'+ "status Placeholder" +'</td>' ;
    result += '<td>'+ value._sensorData +'</td>' ;
    result += '<td>'+ value._dataID + '</td>';
    result += '<td>'+ "Violation Placeholder" + '</td>';
    //FIXME:put this back in if necessary result += '<td>'+ "Action Placeholder" + '</td>';
    //var td = '<button id="btn" name="btn">close channel</button>'
    result += '</tr>';
  });
  ($("#packageTrackingTable tbody")).append(result);

}

function SetRequirements() {

}

function formatTime(timeStamp) {
  time = new Date(timeStamp*1000);
  return time.toUTCString();
}

function isExists(address) {
  return !(checkDuplicates(address));
}

function getABI() {

  /*jQuery.get('./ABI/ABI.json', function(data) {

         ABI=data;
       });*/
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


function renderRaiden() {
  window.location="/home/channel"
}
