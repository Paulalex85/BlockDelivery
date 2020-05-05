const truffleAssert = require('truffle-assertions');
const {createOrder, takeOrder, deliverOrder} = require("../utils/orderMethods");
const {costDisputeProposal, createDispute} = require("../utils/disputeMethods");
const {completeValidationOrder} = require("../utils/orderHelper");
const {createFullAcceptedRefundDispute, costDisputeTestHelper, createToAcceptedDisputeWithdrawHelper} = require("../utils/disputeHelper");
const DeliveryContract = artifacts.require("DeliveryContract");
const {SELLER_PRICE, DELIVER_PRICE} = require('../utils/constants');
const {logContract} = require('../utils/tools');

contract("costDisputeProposal method of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;
    let ESCROW = SELLER_PRICE + DELIVER_PRICE;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[3];
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

        await deliverOrder(deliveryInstance, 0, keyHashBuyer.key, deliver);
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
        await costDisputeProposal(deliveryInstance, 0, -SELLER_PRICE - DELIVER_PRICE, deliver);
    });

    it("Seller should pay more than the escrow limit ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);

        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, -(ESCROW) * 3, (ESCROW) * 2, seller, undefined, DELIVER_PRICE, undefined),
            "User need to send additional cost"
        );
        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, -(ESCROW) * 3, (ESCROW) * 2, seller, undefined, DELIVER_PRICE - 100, DELIVER_PRICE - 100),
            "User need to send additional cost"
        );
        await costDisputeProposal(deliveryInstance, -(ESCROW) * 3, (ESCROW) * 2, seller, undefined, DELIVER_PRICE, DELIVER_PRICE);
    });

    it("Deliver should pay more than the escrow limit ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);

        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, (ESCROW) * 3, -(ESCROW) * 4, deliver, undefined, SELLER_PRICE, undefined),
            "User need to send additional cost"
        );
        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, (ESCROW) * 3, -(ESCROW) * 4, deliver, undefined, SELLER_PRICE - 100, SELLER_PRICE - 100),
            "User need to send additional cost"
        );
        await costDisputeProposal(deliveryInstance, (ESCROW) * 3, -(ESCROW) * 4, deliver, undefined, SELLER_PRICE, SELLER_PRICE);
    });

    it("Seller can pay more but under the escrow limit - with sellerDeliveryPay ", async () => {
        await costDisputeTestHelper(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, -SELLER_PRICE, 0, seller);
    });

    it("Deliver can pay more but under the escrow limit - with sellerDeliveryPay ", async () => {
        await costDisputeTestHelper(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, DELIVER_PRICE, -SELLER_PRICE - DELIVER_PRICE, deliver);
    });

    it("Seller should pay more than the escrow limit - with sellerDeliveryPay", async () => {
        await costDisputeTestHelper(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, -(ESCROW) * 3 + DELIVER_PRICE, (ESCROW) * 2, seller);
    });

    it("Seller should pay more than the escrow limit - with sellerDeliveryPay 2", async () => {
        let orderId = 0;
        await costDisputeTestHelper(deliveryInstance, buyer, seller, deliver);

        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, -(ESCROW) * 3, (ESCROW) * 2 + DELIVER_PRICE, seller, orderId, DELIVER_PRICE, undefined),
            "User need to send additional cost"
        );
        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, -(ESCROW) * 3, (ESCROW) * 2 + DELIVER_PRICE, seller, orderId, DELIVER_PRICE - 100, DELIVER_PRICE - 100),
            "User need to send additional cost"
        );
        await costDisputeProposal(deliveryInstance, -(ESCROW) * 3, (ESCROW) * 2 + DELIVER_PRICE, seller, orderId, DELIVER_PRICE, DELIVER_PRICE);
    });

    it("Deliver should pay more than the escrow limit - with sellerDeliveryPay", async () => {
        await costDisputeTestHelper(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, (ESCROW) * 2 + DELIVER_PRICE * 2, -(ESCROW) * 3 - DELIVER_PRICE, deliver);
    });

    it("Deliver should pay more than the escrow limit - with sellerDeliveryPay 2", async () => {
        let orderId = 0;
        await costDisputeTestHelper(deliveryInstance, buyer, seller, deliver);

        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, (ESCROW) * 2 + DELIVER_PRICE * 3, -(ESCROW) * 3 - DELIVER_PRICE * 2, deliver, orderId, DELIVER_PRICE, undefined),
            "User need to send additional cost"
        );
        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, (ESCROW) * 2 + DELIVER_PRICE * 3, -(ESCROW) * 3 - DELIVER_PRICE * 2, deliver, orderId, DELIVER_PRICE - 100, DELIVER_PRICE - 100),
            "User need to send additional cost"
        );
        await costDisputeProposal(deliveryInstance, (ESCROW) * 2 + DELIVER_PRICE * 3, -(ESCROW) * 3 - DELIVER_PRICE * 2, deliver, orderId, DELIVER_PRICE, DELIVER_PRICE);
    });

    it("Can use the withdraw to pay", async () => {
        await createToAcceptedDisputeWithdrawHelper(deliveryInstance, buyer, seller, deliver);
        let orderId = 1;
        await costDisputeProposal(deliveryInstance, -ESCROW * 3, ESCROW, seller, orderId, ESCROW, 0, 0);
    });

    it("Can use the withdraw to pay but need to add the half", async () => {
        await createToAcceptedDisputeWithdrawHelper(deliveryInstance, buyer, seller, deliver);
        let orderId = 1;
        await costDisputeProposal(deliveryInstance, -ESCROW * 3.5, ESCROW * 1.5, seller, orderId, ESCROW * 1.5, ESCROW * 0.5, 0);
    });

    it("Can use the withdraw to pay and there will be withdraw left", async () => {
        await createToAcceptedDisputeWithdrawHelper(deliveryInstance, buyer, seller, deliver);
        let orderId = 1;
        await costDisputeProposal(deliveryInstance, -ESCROW * 2.5, ESCROW * 0.5, seller, orderId, ESCROW * 0.5, 0, ESCROW * 0.5);
    });

    it("Can use the withdraw to pay but need to send the rest", async () => {
        await createToAcceptedDisputeWithdrawHelper(deliveryInstance, buyer, seller, deliver);
        let orderId = 1;
        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, -ESCROW * 3.5, ESCROW * 1.5, seller, orderId, ESCROW * 1.5, 0, 0),
            "User need to send additional cost"
        );
    });

    it("Buyer can use the withdraw to pay but need to send the rest - 2", async () => {
        await createToAcceptedDisputeWithdrawHelper(deliveryInstance, buyer, seller, deliver);
        let orderId = 1;
        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, -ESCROW * 3.5, ESCROW * 1.5, seller, orderId, ESCROW * 1.5, ESCROW * 0.45, 0),
            "User need to send additional cost"
        );
    });
});
