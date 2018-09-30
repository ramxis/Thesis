var express = require('express');
var router = express.Router();
var fs = require('fs');
var web3 = require('web3');

router.use('/home', require('./home'));
/* GET home page. */
router.get('/', function(req, res, next) {

  res.redirect('login');
});

router.get('/login', function (req, res, next) {
  res.render('login');
});

router.post('/login', function(req, res, next) {
  //var web3 = new Web3(Web3.givenProvider || "ws://localhost:8546");
  filePath = __dirname + '/../public/ABI/contract.txt';
  if(web3.utils.isAddress(req.body.contractAddress)) {
    fs.writeFile(filePath, req.body.contractAddress, (err) => {
      if (err) throw err;
      console.log("The file was succesfully saved!");
      res.end();
    });
    return res.redirect("/home");
  }
  else {
    //req.flash('error',"Invalid Contract Address");
    return res.render("login",{contractAddress:"Invalid-"});
  }



});

module.exports = router;
