const assert = require('assert');
const {fullDeliveredOrder, withdrawBalance} = require("./utils/orderMethods");
const DeliveryContract = artifacts.require("DeliveryContract");
const {SELLER_PRICE, DELIVER_PRICE} = require('./utils/constants');

contract("withdraw balance method of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[0];
        seller = accounts[1];
        deliver = accounts[2];
    });

    it("Deliver and Seller can withdraw balance after delivery ", async () => {
        await fullDeliveredOrder(deliveryInstance, buyer, seller, deliver, 0);
        await withdrawBalance(deliveryInstance, buyer);
        await withdrawBalance(deliveryInstance, deliver);
    });

    it("Withdraw balance increase after multiple orders ", async () => {
        await fullDeliveredOrder(deliveryInstance, buyer, seller, deliver, 0);
        await fullDeliveredOrder(deliveryInstance, buyer, seller, deliver, 1);

        let withdrawBalanceSeller = await deliveryInstance.withdraws.call(seller);
        let withdrawBalanceDeliver = await deliveryInstance.withdraws.call(deliver);

        assert.strictEqual(parseInt(withdrawBalanceSeller), SELLER_PRICE * 2, "Seller withdraw balance should increase");
        assert.strictEqual(parseInt(withdrawBalanceDeliver), DELIVER_PRICE * 2, "Deliver withdraw balance should increase");

        await withdrawBalance(deliveryInstance, buyer);
        await withdrawBalance(deliveryInstance, deliver);
    });
});
