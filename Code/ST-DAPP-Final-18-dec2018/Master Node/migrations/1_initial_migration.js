var Migrations = artifacts.require('./ShipmentTracker.sol');

module.exports = function(deployer) {
  deployer.deploy(Migrations);
};
