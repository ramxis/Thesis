pragma solidity ^0.4.0;

contract helloWorld {
    
   address deployer;
   mapping(address=>uint) accountBalance; 
    function helloWorld() {
        deployer = msg.sender;
    }
    
    function mineCoins(uint rewardCoins, address receiver) {
        if(msg.sender==deployer)
        {
            //send coins
            accountBalance[receiver] += rewardCoins;
        }
        else
        {
            throw;
        }
    }
    
  function viewBalnace() returns(uint){
      return accountBalance[msg.sender];
  }
}