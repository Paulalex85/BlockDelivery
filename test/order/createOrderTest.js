const truffleAssert = require('truffle-assertions');
const {createOrder} = require("../utils/orderMethods");
const DeliveryContract = artifacts.require("DeliveryContract");
const {DELIVER_PRICE} = require('../utils/constants');

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

    it("Can create 2 order", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, deliver, 0);
        await createOrder(deliveryInstance, buyer, seller, deliver, deliver, 1);
    });

    it("Other account can't create account if the're not actor", async () => {
        await truffleAssert.reverts(
            createOrder(deliveryInstance, buyer, seller, deliver, accounts[3])
        );
    });

    it("Shouldn't create order with delay under one day", async () => {
        await truffleAssert.reverts(
            createOrder(deliveryInstance, buyer, seller, deliver, buyer, undefined, undefined, undefined, 60 * 59 * 24, undefined, undefined, undefined),
            "Delay should be at least one day"
        );
    });

    it("Can create an order where the seller pay half the delivery price", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, deliver, undefined, undefined, undefined, undefined, undefined, undefined, undefined, DELIVER_PRICE / 2);
    });

    it("Can create an order where the seller pay all the delivery price", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, deliver, undefined, undefined, undefined, undefined, undefined, undefined, undefined, DELIVER_PRICE);
    });

    it("Can't create an order where the seller pay more than the delivery price", async () => {
        await truffleAssert.reverts(
            createOrder(deliveryInstance, buyer, seller, deliver, buyer, undefined, undefined, undefined, undefined, undefined, undefined, undefined, DELIVER_PRICE + 100),
            "Seller can't pay more than the delivery price"
        );
    });
});
