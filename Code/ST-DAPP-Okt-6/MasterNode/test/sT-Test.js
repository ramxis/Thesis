const ShipmentTracker = artifacts.require('./ShipmentTracker.sol')
contract('ShipmentTracker', function ([owner]) {
	let test
    beforeEach('setup contract for each test', async function () {
        test = await ShipmentTracker.new(owner)
    })
    it('has an owner', async function () {
        assert.equal(await test.owner(), owner)
    })
})