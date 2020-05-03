const assert = require('assert');
const {withdrawBalance} = require("./utils/withdrawMethods");
const {fullDeliveredOrder} = require("./utils/orderHelper");
const {createOrder, validateOrder, endOrder, deliverOrder, takeOrder} = require("./utils/orderMethods");
const DeliveryContract = artifacts.require("DeliveryContract");
const {SELLER_PRICE, DELIVER_PRICE, DEFAULT_ESCROW_VALUE,actors} = require('./utils/constants');

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

        let orderId = 1;
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer, orderId);
        let keyHashBuyer = await validateOrder(deliveryInstance,
            actors.BUYER,
            buyer,
            DEFAULT_ESCROW_VALUE,
            orderId,
            false,
            true,
            false,
            false,
            0);
        let keyHashSeller = await validateOrder(deliveryInstance,
            actors.SELLER,
            seller,
            0,
            orderId,
            false,
            true,
            true,
            false,
            SELLER_PRICE);
        await validateOrder(deliveryInstance,
            actors.DELIVER,
            deliver,
            0,
            orderId,
            true,
            true,
            true,
            true,
            DELIVER_PRICE);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await deliverOrder(deliveryInstance, orderId, keyHashBuyer.key, deliver);
        await endOrder(deliveryInstance, buyer, seller, deliver, orderId, buyer);

        let withdrawBalanceSeller = await deliveryInstance.withdraws.call(seller);
        let withdrawBalanceDeliver = await deliveryInstance.withdraws.call(deliver);
        let withdrawBalanceBuyer = await deliveryInstance.withdraws.call(buyer);

        assert.strictEqual(parseInt(withdrawBalanceSeller), SELLER_PRICE * 2 + DEFAULT_ESCROW_VALUE * 2, "Seller withdraw balance should increase");
        assert.strictEqual(parseInt(withdrawBalanceDeliver), DELIVER_PRICE * 2 + DEFAULT_ESCROW_VALUE * 3, "Deliver withdraw balance should increase");
        assert.strictEqual(parseInt(withdrawBalanceBuyer), DEFAULT_ESCROW_VALUE, "Buyer withdraw balance should increase");

        await withdrawBalance(deliveryInstance, buyer);
        await withdrawBalance(deliveryInstance, deliver);
        await withdrawBalance(deliveryInstance, seller);
    });
});
