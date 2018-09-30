const FundRaise = artifacts.require('./ShipmentTracker.sol')

module.exports = function(deployer) {
    deployer.deploy(FundRaise)
}