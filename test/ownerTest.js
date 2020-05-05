const truffleAssert = require('truffle-assertions');
const assert = require('assert');
const {withdrawBalance} = require("./utils/withdrawMethods");
const {updateOwner} = require("./utils/ownerMethods");
const {fullDeliveredOrder} = require("./utils/orderHelper");
const DeliveryContract = artifacts.require("DeliveryContract");
const {DEFAULT_ESCROW_VALUE} = require('./utils/constants');

contract("Owner test method of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[3];
        seller = accounts[1];
        deliver = accounts[2];
    });

    it("Withdraw balance of owner after change address ", async () => {
        await fullDeliveredOrder(deliveryInstance, buyer, seller, deliver, 0);

        await withdrawBalance(deliveryInstance, buyer);
        await withdrawBalance(deliveryInstance, deliver);
        await withdrawBalance(deliveryInstance, seller);
        await withdrawBalance(deliveryInstance, accounts[0]);

        let newOwner = accounts[4];
        await updateOwner(deliveryInstance, newOwner, accounts[0]);

        await fullDeliveredOrder(deliveryInstance, buyer, seller, deliver, 1);

        let withdrawBalanceOwnerBefore = await deliveryInstance.withdraws.call(accounts[0]);
        assert.strictEqual(parseInt(withdrawBalanceOwnerBefore), 0, "The old balance owner should be empty");
        let withdrawBalanceOwnerNow = await deliveryInstance.withdraws.call(newOwner);
        assert.strictEqual(parseInt(withdrawBalanceOwnerNow), DEFAULT_ESCROW_VALUE * 0.01, "The new balance owner should be filled");
        await withdrawBalance(deliveryInstance, newOwner);
    });

    it("Can't change the owner if from another address ", async () => {
        let newOwner = accounts[4];
        await truffleAssert.reverts(
            updateOwner(deliveryInstance, newOwner, buyer),
            "Not the owner"
        );
    });
});
