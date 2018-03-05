//header("Access-Control-Allow-Origin: *");
//TODO:make sure server version works without control allow extension
$(document).ready(function() {

  $.ajax({
    type:'GET',
    //crossDomain:true,
    url:"http://127.0.0.1:5001/api/1/address",
    //TODO: change url for server deployement
    success: function(data) {
      //alert(data.our_address);
      //$('.Eth-ID').append(data.our_address);
      $('h2').append(data.our_address);
    }

  });
  //TODO: error handling incase ajax fails

  $("#btn_shwchannels").on("click", function(){
    getChannels();
  });

});


//***************/channels endpoint*****************************
function getChannels() {
  $.ajax({
    type:'GET',
    url:"http://127.0.0.1:5001/api/1/channels",
    //TODO: change url for server deployement
    success: displayChannels
  });

}

//********************Open state Channel***************************
function openStateChannel()
{
  //malformed json with 400
  //TODO:auto correct for no of decimals
  alert("open channels called...");
  var formData = JSON.stringify({partner_address:createChannelForm.Ptr_Address.value,token_address:createChannelForm.Tkn_Address.value,balance:createChannelForm.Tkn_Balance.value,settle_timeout:createChannelForm.Timeout.value});
  //console.log(formData);
  //console.log(json_upload);
  var url = "http://127.0.0.1:5001/api/1/channels";
  var xhr = new XMLHttpRequest();
  xhr.open("PUT", url, true);
  xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
  xhr.onload = function ()
  {
  	var resp = JSON.parse(xhr.responseText);
  	if (xhr.readyState == 4 && xhr.status == "200")
    {
  		console.table(resp);
      alert(resp);
  	}
    else
    {
  		console.error(resp);
  	}
};
  xhr.send(formData);
  //document.getElementById('form').submit();
  alert("Form Submitted Successfully...");
}

function displayChannels(data) {
  var result='';
  $.each(data,function(index,value){
    result += '<tr>';
    result += '<td>'+ value.partner_address +'</td>' ;
    result += '<td>'+ value.balance +'</td>' ;
    result += '<td>'+ value.channel_address + '</td>';
    result += '<td>'+ value.token_address +'</td>' ;
    result += '<td>'+ value.state +'</td>' ;
    result += '<td>'+ value.settle_timeout +'</td>' ;
    //var td = '<button id="btn" name="btn">close channel</button>'
    result += '</tr>';
  });
  $('#channelsDataTable').append(result);
  paintStateCells();
}

function closeChannel()
{
  //TODO:erro handling
  var formData = JSON.stringify({"state":"closed"});
  //console.log(json_upload);
  var url = "http://localhost:5001/api/1/channels/"+cform.channelID.value;
  var xhr = new XMLHttpRequest();
  xhr.open("patch", url, true);
  xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
  xhr.onload = function ()
  {
    var resp = JSON.parse(xhr.responseText);
    if (xhr.readyState == 4 && xhr.status == "200")
    {
      console.table(resp);
    }
    else
    {
      console.error(resp);
    }
};
  xhr.send(formData);
  //document.getElementById('form').submit();
  alert("close Submitted Successfully...");
}

function transferCoins()
{
  //TODO:erro handling
  var formData = JSON.stringify({"amount":amount.value});
  //console.log(json_upload);
  var url = "http://localhost:5001/api/1/transfers"+tform.tokenaddr.value+tform.prtnraddr.value;
  var xhr = new XMLHttpRequest();
  xhr.open("post", url, true);
  xhr.setRequestHeader('Content-type','application/json; charset=utf-8');
  xhr.onload = function ()
  {
    var resp = JSON.parse(xhr.responseText);
    if (xhr.readyState == 4 && xhr.status == "200")
    {
      console.table(resp);
    }
    else
    {
      console.error(resp);
    }
};
  xhr.send(formData);
  //document.getElementById('form').submit();
  alert("close Submitted Successfully...");
}

function paintStateCells()
{

  var table = document.getElementById('channelsDataTable');
  var tbody = table.getElementsByTagName('tbody')[0];
  var cells = tbody.getElementsByTagName('td');

  for (var i=0, len=cells.length; i<len; i++){
      var cellState = cells[i].innerHTML;
      if (cellState=="opened"){
          cells[i].style.backgroundColor = 'green';
      }
      else if(cellState=="closed")
      {
        cells[i].style.backgroundColor = 'red';
      }
      else if(cellState=="settled")
      {
        cells[i].style.backgroundColor = 'yellow';
      }

  }
}
function div_createChannelForm() {

  document.getElementById('popup').style.display = "block";
}
function div_hide(){
  document.getElementById('popup').style.display = "none";
}
function check_empty() {
  if (document.getElementById('Ptr_Address').value == "" || document.getElementById('Timeout').value == ""  || document.getElementById('Tkn_Address').value == "" || document.getElementById('Tkn_Balance').value == "")
  {
    alert("Fill All Fields !");
  }
  else
  {
    //TODO:validateinput()
    openStateChannel();

  }
}
//TODO:function validateInput() //validate form inputs i.e balance and settle timeout shoudl be numbers..
//TODO: ... and balance should not be greater then token balance
//TODO:settle timeout should not be more then reveal timeout && other input senitations
//Function to Hide Popup


//FIXME: remove this later
//onclick().getChannels().done(displayChannels);
/*angular.module('schannels', []).controller('channels', function($scope, $http)
{
    $http.get('http://127.0.0.1:5001/api/1/channels').then(function(response)
    {
            $scope.ethAcc = response.data;
    });
});*/
