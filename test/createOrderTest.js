const truffleAssert = require('truffle-assertions');
const assert = require('assert');
const {createOrder} = require("./utils/orderMethods");
const DeliveryContract = artifacts.require("DeliveryContract");
const {SELLER_PRICE, DELIVER_PRICE, DELAY_ORDER} = require('./utils/constants');

contract("createOrder method of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[0];
        seller = accounts[1];
        deliver = accounts[2];
    });

    it("Buyer Should use orderCreate", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
    });

    it("Seller Should use orderCreate", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, seller);
    });

    it("Deliver Should use orderCreate", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, deliver);
    });

    it("Other account can't create account if the're not actor", async () => {
        await truffleAssert.reverts(
            createOrder(deliveryInstance, buyer, seller, deliver, accounts[3])
        );
    });

    it("Should return an integer when orderCreate", async () => {
        let orderId = await deliveryInstance.createOrder.call(
            buyer,
            seller,
            deliver,
            SELLER_PRICE,
            DELIVER_PRICE,
            DELAY_ORDER,
            {from: buyer}
        );

        assert.strictEqual(orderId.toNumber(), 0, "Order should be stored with this id");
    });

    it("Shouldn't send eth to orderCreate", async () => {
        await truffleAssert.reverts(
            deliveryInstance.createOrder.call(
                buyer,
                seller,
                deliver,
                SELLER_PRICE,
                DELIVER_PRICE,
                DELAY_ORDER,
                {from: buyer, value: 50}
            ),
            "revert"
        );
    });

    it("Shouldn't create order with delay under one hour", async () => {
        await truffleAssert.reverts(
            deliveryInstance.createOrder.call(
                buyer,
                seller,
                deliver,
                SELLER_PRICE,
                DELIVER_PRICE,
                60 * 59, //59 minutes
                {from: buyer}
            ),
            "Delay should be at least one hour"
        );
    });
});
