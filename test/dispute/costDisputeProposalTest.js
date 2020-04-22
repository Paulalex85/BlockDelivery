const truffleAssert = require('truffle-assertions');
const {createOrder, completeValidationOrder, takeOrder, createFullAcceptedRefundDispute, createDispute, costDisputeProposal, deliverOrder} = require("../utils/orderMethods");
const DeliveryContract = artifacts.require("DeliveryContract");
const {SELLER_PRICE, DELIVER_PRICE} = require('../utils/constants');

contract("costDisputeProposal method of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[0];
        seller = accounts[1];
        deliver = accounts[2];
    });

    it("Seller can cost proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, -SELLER_PRICE, -DELIVER_PRICE, seller);
    });


    it("Deliver can cost proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, -SELLER_PRICE, -DELIVER_PRICE, deliver);
    });

    it("Buyer can't cost proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, -SELLER_PRICE, -DELIVER_PRICE, buyer),
            "Should be the seller or the deliver of the order"
        );
    });

    it("Can't accept proposal at wrong stage ", async () => {
        let orderId = 0;
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, -SELLER_PRICE, -DELIVER_PRICE, seller),
            "Order should be Cost Repartition stage"
        );

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, -SELLER_PRICE, -DELIVER_PRICE, seller),
            "Order should be Cost Repartition stage"
        );

        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, -SELLER_PRICE, -DELIVER_PRICE, seller),
            "Order should be Cost Repartition stage"
        );

        await deliverOrder(deliveryInstance, buyer, seller, deliver, 0, keyHashBuyer.key, deliver);
        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, -SELLER_PRICE, -DELIVER_PRICE, seller),
            "Order should be Cost Repartition stage"
        );

        orderId = 1;
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer, orderId);

        let keyHash = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHash.keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, deliver, undefined, orderId);
        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, -SELLER_PRICE, -DELIVER_PRICE, seller, orderId),
            "Order should be Cost Repartition stage"
        );
    });

    it("Cost repartition test ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, SELLER_PRICE, -DELIVER_PRICE, seller),
            "Cost repartition should be equal to 0"
        );

        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, -SELLER_PRICE, DELIVER_PRICE, seller),
            "Cost repartition should be equal to 0"
        );
    });

    it("Seller can pay more but under the escrow limit ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, -SELLER_PRICE - DELIVER_PRICE, 0, seller);
    });

    it("Deliver can pay more but under the escrow limit ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, 0, -SELLER_PRICE - DELIVER_PRICE, seller);
    });

    it("Seller should pay more than the escrow limit ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);

        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, -(SELLER_PRICE + DELIVER_PRICE) * 3, (SELLER_PRICE + DELIVER_PRICE) * 2, seller, undefined, DELIVER_PRICE, undefined),
            "User need to send additional cost"
        );
        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, -(SELLER_PRICE + DELIVER_PRICE) * 3, (SELLER_PRICE + DELIVER_PRICE) * 2, seller, undefined, DELIVER_PRICE - 100, undefined),
            "User need to send additional cost"
        );
        await costDisputeProposal(deliveryInstance, -(SELLER_PRICE + DELIVER_PRICE) * 3, (SELLER_PRICE + DELIVER_PRICE) * 2, seller, undefined, DELIVER_PRICE, DELIVER_PRICE);
    });


    it("Deliver should pay more than the escrow limit ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);

        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, (SELLER_PRICE + DELIVER_PRICE) * 3, -(SELLER_PRICE + DELIVER_PRICE) * 4, deliver, undefined, SELLER_PRICE, undefined),
            "User need to send additional cost"
        );
        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, (SELLER_PRICE + DELIVER_PRICE) * 3, -(SELLER_PRICE + DELIVER_PRICE) * 4, deliver, undefined, SELLER_PRICE - 100, undefined),
            "User need to send additional cost"
        );
        await costDisputeProposal(deliveryInstance, (SELLER_PRICE + DELIVER_PRICE) * 3, -(SELLER_PRICE + DELIVER_PRICE) * 4, deliver, undefined, SELLER_PRICE, SELLER_PRICE);
    });
});
