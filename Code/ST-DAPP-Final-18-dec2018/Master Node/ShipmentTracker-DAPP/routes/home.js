//all web3 related code goes here
var express = require('express');
var router = express.Router();
var fs = require('fs');
var web3 =require('web3');
router.get('/', function(req, res, next) {
  var contractAddress=fs.readFileSync(__dirname + '/../public/ABI/contract.txt');
  var x= web3.utils.randomHex(4);
   x=x.substr(2,8);
  console.log('random number is:' + x);
  //var contractABI = fs.readFileSync(__dirname + '/../public/ABI/ABI.json');
  res.render('index',{contractAddress:contractAddress});
  /*filePath = __dirname + '/../public/ABI/contract.txt';
  var contractAddress=fs.readFileSync(filePath);
  ABI=fs.readFileSync(__dirname + '/../public/ABI/ABI.json');
  var ethAccount=init();
  console.log(ethAccount);
  res.render('index',{contractAddress:contractAddress,ethAccount:ethAccount});*/
});

/*function writeLog() {
  filePath = __dirname + '/../public/log/log.txt';
  fs.appendFile(filePath,'data',(err) => {
    if (err) throw err;
    console.log("The file was succesfully appended!");
    //res.end();
  });
}
setInterval(writeLog, 10*1000);*/
router.get('/channel', function(req, res, next) {
  console.log('rendering raiden');
  res.render('raiden');

});
/*function init() {
      console.log("script loaded");
      //console.log(top.contractAddress);
      if(typeof web3!=='undefined') {
        console.log("if called");
         web33=new Web3(web3.currentProvider);
       }
      else {
         web33 =new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));//FIXME:change to local geth or remote geth
         console.log('else called');
         console.log(web33.eth.accounts);
       }

}*/
module.exports = router;
