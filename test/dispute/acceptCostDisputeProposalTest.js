const truffleAssert = require('truffle-assertions');
const {createOrder, completeValidationOrder, takeOrder, createFullAcceptedRefundDispute, costDisputeProposal, acceptCostDisputeProposal, createDispute, deliverOrder} = require("../utils/orderMethods");
const DeliveryContract = artifacts.require("DeliveryContract");
const {SELLER_PRICE, DELIVER_PRICE} = require('../utils/constants');

contract("acceptCostDisputeProposal method of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;
    let defaultEscrow = DELIVER_PRICE + SELLER_PRICE;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[0];
        seller = accounts[1];
        deliver = accounts[2];
    });

    it("Seller can accept cost dispute proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, -SELLER_PRICE, -DELIVER_PRICE, deliver);
        await acceptCostDisputeProposal(deliveryInstance, seller, defaultEscrow * 2, defaultEscrow * 3);
    });

    it("Deliver can accept cost dispute proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, -SELLER_PRICE, -DELIVER_PRICE, seller);
        await acceptCostDisputeProposal(deliveryInstance, deliver, defaultEscrow * 2, defaultEscrow * 3);
    });

    it("Buyer can't accept cost dispute proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, -SELLER_PRICE, -DELIVER_PRICE, seller);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, buyer, defaultEscrow * 2, defaultEscrow * 3),
            "Should be the seller or the deliver of the order"
        );
    });

    it("Can't accept cost proposal at wrong stage ", async () => {
        let orderId = 0;
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, deliver, defaultEscrow * 2, defaultEscrow * 3),
            "Order should be Cost Repartition stage"
        );

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, deliver, defaultEscrow * 2, defaultEscrow * 3),
            "Order should be Cost Repartition stage"
        );

        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, deliver, defaultEscrow * 2, defaultEscrow * 3),
            "Order should be Cost Repartition stage"
        );

        await deliverOrder(deliveryInstance, buyer, seller, deliver, 0, keyHashBuyer.key, deliver);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, deliver, defaultEscrow * 2, defaultEscrow * 3),
            "Order should be Cost Repartition stage"
        );

        orderId = 1;
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer, orderId);

        let keyHash = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHash.keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, deliver, undefined, orderId);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, deliver, defaultEscrow * 2, defaultEscrow * 3),
            "Order should be Cost Repartition stage"
        );
    });

    it("Should define cost repartition ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, seller, defaultEscrow * 2, defaultEscrow * 3),
            "Cost Repartition is not defined"
        );
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, deliver, defaultEscrow * 2, defaultEscrow * 3),
            "Cost Repartition is not defined"
        );
    });

    it("Seller can pay more but under the escrow limit ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, -SELLER_PRICE - DELIVER_PRICE, 0, deliver);
        await acceptCostDisputeProposal(deliveryInstance, seller, defaultEscrow * 2 - DELIVER_PRICE, defaultEscrow * 3 + DELIVER_PRICE);
    });

    it("Deliver can pay more but under the escrow limit ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, 0, -SELLER_PRICE - DELIVER_PRICE, seller);
        await acceptCostDisputeProposal(deliveryInstance, deliver, defaultEscrow * 2 + SELLER_PRICE, defaultEscrow * 3 - SELLER_PRICE);
    });

    it("Seller should pay more than the escrow limit ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, -(SELLER_PRICE + DELIVER_PRICE) * 3, (SELLER_PRICE + DELIVER_PRICE) * 2, deliver);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, seller, 0, (SELLER_PRICE + DELIVER_PRICE) * 5 + DELIVER_PRICE, undefined, DELIVER_PRICE, undefined),
            "User need to send additional cost"
        );
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, seller, 0, (SELLER_PRICE + DELIVER_PRICE) * 5 + DELIVER_PRICE, undefined, DELIVER_PRICE, DELIVER_PRICE - 100),
            "User need to send additional cost"
        );
        await acceptCostDisputeProposal(deliveryInstance, seller, 0, (SELLER_PRICE + DELIVER_PRICE) * 5 + DELIVER_PRICE, undefined, DELIVER_PRICE, DELIVER_PRICE);
    });

    it("Deliver should pay more than the escrow limit ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, (SELLER_PRICE + DELIVER_PRICE) * 3, -(SELLER_PRICE + DELIVER_PRICE) * 4, seller);

        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, deliver, (SELLER_PRICE + DELIVER_PRICE) * 5 + SELLER_PRICE, 0, undefined, SELLER_PRICE, undefined),
            "User need to send additional cost"
        );
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, deliver, (SELLER_PRICE + DELIVER_PRICE) * 5 + SELLER_PRICE, 0, undefined, SELLER_PRICE, SELLER_PRICE - 100),
            "User need to send additional cost"
        );

        await acceptCostDisputeProposal(deliveryInstance, deliver, (SELLER_PRICE + DELIVER_PRICE) * 5 + SELLER_PRICE, 0, undefined, SELLER_PRICE, SELLER_PRICE);
    });

    it("Seller can pay more but under the escrow limit - with sellerDeliveryPay ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, deliver, undefined, undefined, undefined, undefined, undefined, undefined, undefined, DELIVER_PRICE);
        let orderId = 0;
        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId, DELIVER_PRICE);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver, orderId, SELLER_PRICE);
        await costDisputeProposal(deliveryInstance, -SELLER_PRICE, 0, deliver);
        await acceptCostDisputeProposal(deliveryInstance, seller, defaultEscrow * 2, defaultEscrow * 3 + DELIVER_PRICE);
    });

    it("Deliver can pay more but under the escrow limit - with sellerDeliveryPay ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, deliver, undefined, undefined, undefined, undefined, undefined, undefined, undefined, DELIVER_PRICE);
        let orderId = 0;
        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId, DELIVER_PRICE);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver, orderId, SELLER_PRICE);
        await costDisputeProposal(deliveryInstance, DELIVER_PRICE, -SELLER_PRICE - DELIVER_PRICE, seller);
        await acceptCostDisputeProposal(deliveryInstance, deliver, defaultEscrow * 3, defaultEscrow * 3 - SELLER_PRICE);
    });

    it("Seller should pay more than the escrow limit - with sellerDeliveryPay", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, deliver, undefined, undefined, undefined, undefined, undefined, undefined, undefined, DELIVER_PRICE);
        let orderId = 0;
        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId, DELIVER_PRICE);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver, orderId, SELLER_PRICE);
        await costDisputeProposal(deliveryInstance, -defaultEscrow * 3, defaultEscrow * 2 + DELIVER_PRICE, deliver, orderId);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, seller, 0, defaultEscrow * 5 + DELIVER_PRICE * 2, undefined, DELIVER_PRICE, undefined),
            "User need to send additional cost"
        );
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, seller, 0, defaultEscrow * 5 + DELIVER_PRICE * 2, undefined, DELIVER_PRICE, DELIVER_PRICE - 100),
            "User need to send additional cost"
        );
        await acceptCostDisputeProposal(deliveryInstance, seller, 0, defaultEscrow * 5 + DELIVER_PRICE * 2, undefined, DELIVER_PRICE, DELIVER_PRICE);
    });

    it("Deliver should pay more than the escrow limit - with sellerDeliveryPay", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, deliver, undefined, undefined, undefined, undefined, undefined, undefined, undefined, DELIVER_PRICE);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId, DELIVER_PRICE);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver, orderId, SELLER_PRICE);
        await costDisputeProposal(deliveryInstance, defaultEscrow * 2 + DELIVER_PRICE * 3, -defaultEscrow * 3 - DELIVER_PRICE * 2, seller, orderId);

        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, deliver, defaultEscrow * 5 + DELIVER_PRICE * 2, 0, undefined, DELIVER_PRICE, undefined),
            "User need to send additional cost"
        );
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, deliver, defaultEscrow * 5 + DELIVER_PRICE * 2, 0, undefined, DELIVER_PRICE, DELIVER_PRICE - 100),
            "User need to send additional cost"
        );

        await acceptCostDisputeProposal(deliveryInstance, deliver, defaultEscrow * 5 + DELIVER_PRICE * 2, 0, undefined, DELIVER_PRICE, DELIVER_PRICE);

    });
});
