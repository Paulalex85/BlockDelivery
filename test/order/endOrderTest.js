const truffleAssert = require('truffle-assertions');
const {endOrder} = require("../utils/orderMethods");
const {createToDeliver} = require("../utils/orderHelper");
const DeliveryContract = artifacts.require("DeliveryContract");
const {DELIVER_PRICE} = require('../utils/constants');

contract("end order method of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[3];
        seller = accounts[1];
        deliver = accounts[2];
    });

    it("Buyer can end an order ", async () => {
        let orderId = 0;
        await createToDeliver(deliveryInstance, buyer, seller, deliver, orderId);
        await endOrder(deliveryInstance, buyer, seller, deliver, orderId, buyer);
    });

    it("Seller and Deliver can't end an order ", async () => {
        let orderId = 0;
        await createToDeliver(deliveryInstance, buyer, seller, deliver, orderId);
        await truffleAssert.reverts(
            endOrder(deliveryInstance, buyer, seller, deliver, orderId, seller),
            "Sender is not the buyer"
        );

        await truffleAssert.reverts(
            endOrder(deliveryInstance, buyer, seller, deliver, orderId, deliver),
            "Sender is not the buyer"
        );
    });

    it("Seller pay all the delivery price but withdraw don't change", async () => {
        let orderId = 0;
        await createToDeliver(deliveryInstance, buyer, seller, deliver, orderId, DELIVER_PRICE);
        await endOrder(deliveryInstance, buyer, seller, deliver, orderId, buyer);
    });
});
