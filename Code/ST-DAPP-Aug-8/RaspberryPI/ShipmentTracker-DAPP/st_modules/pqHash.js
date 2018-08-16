var Web3 = require('web3');

function getHash(message) {
  //logic for calculating Postquantum hash goes here
  //return Web3.utils.sha3(message);
  return 1;
}
module.exports.getHash = getHash;