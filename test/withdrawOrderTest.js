const assert = require('assert');
const {withdrawBalance} = require("./utils/withdrawMethods");
const {fullDeliveredOrder} = require("./utils/orderHelper");
const DeliveryContract = artifacts.require("DeliveryContract");
const {SELLER_PRICE, DELIVER_PRICE} = require('./utils/constants');
const ESCROW = SELLER_PRICE + DELIVER_PRICE;

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
        await withdrawBalance(deliveryInstance, seller);
        await withdrawBalance(deliveryInstance, deliver);
        await withdrawBalance(deliveryInstance, buyer);
    });

    it("Withdraw balance increase after multiple orders ", async () => {
        await fullDeliveredOrder(deliveryInstance, buyer, seller, deliver, 0);
        await fullDeliveredOrder(deliveryInstance, buyer, seller, deliver, 1);

        let withdrawBalanceSeller = await deliveryInstance.withdraws.call(seller);
        let withdrawBalanceDeliver = await deliveryInstance.withdraws.call(deliver);
        let withdrawBalanceBuyer = await deliveryInstance.withdraws.call(buyer);

        assert.strictEqual(parseInt(withdrawBalanceSeller), SELLER_PRICE * 2 + ESCROW * 4, "Seller withdraw balance should increase");
        assert.strictEqual(parseInt(withdrawBalanceDeliver), DELIVER_PRICE * 2 + ESCROW * 6, "Deliver withdraw balance should increase");
        assert.strictEqual(parseInt(withdrawBalanceBuyer), ESCROW * 2, "Buyer withdraw balance should increase");

        await withdrawBalance(deliveryInstance, buyer);
        await withdrawBalance(deliveryInstance, deliver);
        await withdrawBalance(deliveryInstance, seller);
    });
});
