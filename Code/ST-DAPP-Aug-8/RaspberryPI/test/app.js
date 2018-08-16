const express = require('express')
const app = express()
const crypto = require('crypto');
const Web3 = require('web3');
var EthereumTx = require('ethereumjs-tx');
var web3;
app.get('/', (req, res) => res.send('Hello World!'))

app.listen(3000, function main() {
	console.log('Example app listening on port 3000!')
	const buf = crypto.randomBytes(32);
	var seed = buf.toString('hex');
	console.log(`${buf.length*8} bits of random data: ${buf.toString('hex')}`);

	var pvtkey = "eff3bc952afdc46400bcfc07a5699f525119760f364cb04129323e207fcdc18c";
	seed="53f0d1c88ef1dfadde6890ccb61b700f4bbc870fc1ccc78ef9ce13faee4e8434";
	web3=new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
	var abi = [
	{
		"constant": true,
		"inputs": [
			{
				"name": "_signature",
				"type": "bytes32"
			},
			{
				"name": "_secretKey",
				"type": "string"
			},
			{
				"name": "_seed",
				"type": "string"
			}
		],
		"name": "VerifyDigitalSignature",
		"outputs": [
			{
				"name": "",
				"type": "bool"
			},
			{
				"name": "",
				"type": "bytes32"
			}
		],
		"payable": false,
		"stateMutability": "view",
		"type": "function"
	}
]

    shipmentTracker = web3.eth.contract(abi).at("0xa6831a2ab89b781abe19d71b130001abc88d1573");
    web3.eth.defaultAccount = web3.eth.accounts[0];
    console.log(web3.eth.defaultAccount);


	var sig1 = web3.sha3(seed + pvtkey);//works
	//var sig = web3.fromAscii(sig1)
	console.log('sig is : ',sig1);
	var result = shipmentTracker.VerifyDigitalSignature(sig1,pvtkey,seed);
	console.log(result);

})