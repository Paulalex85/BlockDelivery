const truffleAssert = require('truffle-assertions');
const {createOrder, takeOrder, deliverOrder} = require("../utils/orderMethods");
const {completeValidationOrder, fullDeliveredOrder} = require("../utils/orderHelper");
const DeliveryContract = artifacts.require("DeliveryContract");
const {DELIVER_PRICE} = require('../utils/constants');
const {generateKeyHash} = require('../utils/tools');

contract("deliverOrder method of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[0];
        seller = accounts[1];
        deliver = accounts[2];
    });

    it("Deliver should delivered the order ", async () => {
        await fullDeliveredOrder(deliveryInstance, buyer, seller, deliver, 0);
    });

    it("DeliverOrder fail with wrong key ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await truffleAssert.reverts(
            deliverOrder(deliveryInstance,  orderId, generateKeyHash().key, deliver),
            "The key doesn't match with the stored hash"
        );
    });

    it("DeliverOrder can't be call by seller or buyer ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await truffleAssert.reverts(
            deliverOrder(deliveryInstance,  orderId, keyHashBuyer.key, buyer),
            "Sender is not the deliver"
        );

        await truffleAssert.reverts(
            deliverOrder(deliveryInstance,  orderId, keyHashSeller.key, seller),
            "Sender is not the deliver"
        );
    });

    it("DeliverOrder need taken stage ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        await truffleAssert.reverts(
            deliverOrder(deliveryInstance,  orderId, generateKeyHash().key, deliver),
            "The order isn't at the required stage"
        );
        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await truffleAssert.reverts(
            deliverOrder(deliveryInstance,  orderId, keyHashSeller.key, deliver),
            "The order isn't at the required stage"
        );
    });
});
