const truffleAssert = require('truffle-assertions');
const {createOrder, takeOrder} = require("../utils/orderMethods");
const {completeValidationOrder} = require("../utils/orderHelper");
const DeliveryContract = artifacts.require("DeliveryContract");
const {generateKeyHash} = require('../utils/tools');

contract("takeOrder method of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[3];
        seller = accounts[1];
        deliver = accounts[2];
    });

    it("Deliver should take the order ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
    });

    it("takeOrder fail with wrong key ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await truffleAssert.reverts(
            takeOrder(deliveryInstance, orderId, generateKeyHash().key, deliver),
            "The key doesn't match with the stored hash"
        );
    });

    it("takeOrder can't be call by seller or buyer ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await truffleAssert.reverts(
            takeOrder(deliveryInstance, orderId, keyHashSeller.key, buyer),
            "Sender is not the deliver"
        );

        await truffleAssert.reverts(
            takeOrder(deliveryInstance, orderId, keyHashSeller.key, seller),
            "Sender is not the deliver"
        );
    });

    it("takeOrder need started stage ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        await truffleAssert.reverts(
            takeOrder(deliveryInstance, orderId, generateKeyHash().key, deliver),
            "The order isn't at the required stage"
        );
    });
});
