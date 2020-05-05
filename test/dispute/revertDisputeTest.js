const truffleAssert = require('truffle-assertions');
const {createOrder, takeOrder, deliverOrder} = require("../utils/orderMethods");
const {createDispute, revertDispute} = require("../utils/disputeMethods");
const {completeValidationOrder} = require("../utils/orderHelper");
const {createFullAcceptedRefundDispute} = require("../utils/disputeHelper");
const DeliveryContract = artifacts.require("DeliveryContract");

contract("revertDispute method of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[3];
        seller = accounts[1];
        deliver = accounts[2];
    });

    it("Can revert a dispute and re create one ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, buyer);
        await revertDispute(deliveryInstance, buyer);
        await createDispute(deliveryInstance, buyer);
    });

    it("Buyer can revert a dispute ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, buyer);
        await revertDispute(deliveryInstance, buyer);
    });

    it("Seller can revert a dispute ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, seller);
        await revertDispute(deliveryInstance, seller);
    });

    it("Deliver can revert a dispute ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, deliver);
        await truffleAssert.reverts(
            revertDispute(deliveryInstance, accounts[9]),
            "Should be an actor of the order"
        );
    });

    it("Deliver can revert a dispute ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, deliver);
        await revertDispute(deliveryInstance, deliver);
    });

    it("Can't revert dispute at wrong stage ", async () => {
        let orderId = 0;
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await truffleAssert.reverts(
            revertDispute(deliveryInstance, buyer),
            "Order should be Refund Determination stage"
        );

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await truffleAssert.reverts(
            revertDispute(deliveryInstance, buyer),
            "Order should be Refund Determination stage"
        );

        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await truffleAssert.reverts(
            revertDispute(deliveryInstance, buyer),
            "Order should be Refund Determination stage"
        );

        await deliverOrder(deliveryInstance,  0, keyHashBuyer.key, deliver);
        await truffleAssert.reverts(
            revertDispute(deliveryInstance, buyer),
            "Order should be Refund Determination stage"
        );

        orderId = 1;
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer, orderId);

        let keyHash = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHash.keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver, orderId);
        await truffleAssert.reverts(
            revertDispute(deliveryInstance, buyer, orderId),
            "Order should be Refund Determination stage"
        );
    });
});
