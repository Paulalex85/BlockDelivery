const truffleAssert = require('truffle-assertions');
const {createOrder, takeOrder, deliverOrder} = require("../utils/orderMethods");
const {getWithdraw} = require("../utils/withdrawMethods");
const {costDisputeProposal, acceptCostDisputeProposal, createDispute} = require("../utils/disputeMethods");
const {createFullAcceptedRefundDispute, costDisputeTestHelper, createToAcceptedDisputeWithdrawHelper} = require("../utils/disputeHelper");
const {completeValidationOrder} = require("../utils/orderHelper");
const DeliveryContract = artifacts.require("DeliveryContract");
const {SELLER_PRICE, DELIVER_PRICE, DEFAULT_ESCROW_VALUE} = require('../utils/constants');
const {logContract} = require('../utils/tools');

contract("acceptCostDisputeProposal method of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[3];
        seller = accounts[1];
        deliver = accounts[2];
    });

    it("Seller can accept cost dispute proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, -SELLER_PRICE + DEFAULT_ESCROW_VALUE / 2, deliver);
        await acceptCostDisputeProposal(deliveryInstance, seller, DEFAULT_ESCROW_VALUE * 2, DEFAULT_ESCROW_VALUE * 3);
    });

    it("Deliver can accept cost dispute proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, -SELLER_PRICE + DEFAULT_ESCROW_VALUE / 2, seller);
        await acceptCostDisputeProposal(deliveryInstance, deliver, DEFAULT_ESCROW_VALUE * 2, DEFAULT_ESCROW_VALUE * 3);
    });

    it("Buyer can't accept cost dispute proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, -SELLER_PRICE + DEFAULT_ESCROW_VALUE / 2, seller);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, buyer, DEFAULT_ESCROW_VALUE * 2, DEFAULT_ESCROW_VALUE * 3),
            "Should be the seller or the deliver of the order"
        );
    });

    it("Can't accept cost proposal at wrong stage ", async () => {
        let orderId = 0;
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, deliver, DEFAULT_ESCROW_VALUE * 2, DEFAULT_ESCROW_VALUE * 3),
            "Order should be Cost Repartition stage"
        );

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, deliver, DEFAULT_ESCROW_VALUE * 2, DEFAULT_ESCROW_VALUE * 3),
            "Order should be Cost Repartition stage"
        );

        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, deliver, DEFAULT_ESCROW_VALUE * 2, DEFAULT_ESCROW_VALUE * 3),
            "Order should be Cost Repartition stage"
        );

        await deliverOrder(deliveryInstance, 0, keyHashBuyer.key, deliver);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, deliver, DEFAULT_ESCROW_VALUE * 2, DEFAULT_ESCROW_VALUE * 3),
            "Order should be Cost Repartition stage"
        );

        orderId = 1;
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer, orderId);

        let keyHash = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHash.keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, deliver, undefined, orderId);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, deliver, DEFAULT_ESCROW_VALUE * 2, DEFAULT_ESCROW_VALUE * 3),
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
            acceptCostDisputeProposal(deliveryInstance, seller, DEFAULT_ESCROW_VALUE * 2, DEFAULT_ESCROW_VALUE * 3),
            "Cost Repartition is not defined"
        );
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, deliver, DEFAULT_ESCROW_VALUE * 2, DEFAULT_ESCROW_VALUE * 3),
            "Cost Repartition is not defined"
        );
    });

    it("Seller can pay more but under the escrow limit ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, -DEFAULT_ESCROW_VALUE / 2, deliver);
        await acceptCostDisputeProposal(deliveryInstance, seller, DEFAULT_ESCROW_VALUE * 2 - DELIVER_PRICE, DEFAULT_ESCROW_VALUE * 3 + DELIVER_PRICE);
    });

    it("Deliver can pay more but under the escrow limit ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, DEFAULT_ESCROW_VALUE / 2, seller);
        await acceptCostDisputeProposal(deliveryInstance, deliver, DEFAULT_ESCROW_VALUE * 2 + SELLER_PRICE, DEFAULT_ESCROW_VALUE * 3 - SELLER_PRICE);
    });

    it("Seller should pay more than the escrow limit ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, -(SELLER_PRICE + DELIVER_PRICE) * 2.5, deliver);
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
        await costDisputeProposal(deliveryInstance, (SELLER_PRICE + DELIVER_PRICE) * 3.5, seller);

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
        await costDisputeTestHelper(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, -SELLER_PRICE / 2, deliver);
        await acceptCostDisputeProposal(deliveryInstance, seller, DEFAULT_ESCROW_VALUE * 2, DEFAULT_ESCROW_VALUE * 3 + DELIVER_PRICE);
    });

    it("Deliver can pay more but under the escrow limit - with sellerDeliveryPay ", async () => {
        await costDisputeTestHelper(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, SELLER_PRICE / 2 + DELIVER_PRICE, seller);
        await acceptCostDisputeProposal(deliveryInstance, deliver, DEFAULT_ESCROW_VALUE * 3, DEFAULT_ESCROW_VALUE * 3 - SELLER_PRICE);
    });

    it("Seller should pay more than the escrow limit - with sellerDeliveryPay", async () => {
        let orderId = 0;
        await costDisputeTestHelper(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, -(DEFAULT_ESCROW_VALUE) * 3 + SELLER_PRICE / 2, deliver, orderId);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, seller, 0, DEFAULT_ESCROW_VALUE * 5 + DELIVER_PRICE * 2, undefined, DELIVER_PRICE, undefined),
            "User need to send additional cost"
        );
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, seller, 0, DEFAULT_ESCROW_VALUE * 5 + DELIVER_PRICE * 2, undefined, DELIVER_PRICE, DELIVER_PRICE - 100),
            "User need to send additional cost"
        );
        await acceptCostDisputeProposal(deliveryInstance, seller, 0, DEFAULT_ESCROW_VALUE * 5 + DELIVER_PRICE * 2, undefined, DELIVER_PRICE, DELIVER_PRICE);
    });

    it("Deliver should pay more than the escrow limit - with sellerDeliveryPay", async () => {
        let orderId = 0;
        await costDisputeTestHelper(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, (DEFAULT_ESCROW_VALUE) * 2 + DELIVER_PRICE * 3 + SELLER_PRICE / 2, seller, orderId);

        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, deliver, DEFAULT_ESCROW_VALUE * 5 + DELIVER_PRICE * 2, 0, undefined, DELIVER_PRICE, undefined),
            "User need to send additional cost"
        );
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, deliver, DEFAULT_ESCROW_VALUE * 5 + DELIVER_PRICE * 2, 0, undefined, DELIVER_PRICE, DELIVER_PRICE - 100),
            "User need to send additional cost"
        );

        await acceptCostDisputeProposal(deliveryInstance, deliver, DEFAULT_ESCROW_VALUE * 5 + DELIVER_PRICE * 2, 0, undefined, DELIVER_PRICE, DELIVER_PRICE);
    });

    it("Can use the withdraw to pay", async () => {
        await createToAcceptedDisputeWithdrawHelper(deliveryInstance, buyer, seller, deliver);
        let orderId = 1;
        await costDisputeProposal(deliveryInstance, -DEFAULT_ESCROW_VALUE * 2, deliver, orderId, 0, 0, 0);
        await acceptCostDisputeProposal(deliveryInstance, seller, -DEFAULT_ESCROW_VALUE, DEFAULT_ESCROW_VALUE * 3, orderId, DEFAULT_ESCROW_VALUE, 0);
    });

    it("Can use the withdraw to pay but need to add the half", async () => {
        await createToAcceptedDisputeWithdrawHelper(deliveryInstance, buyer, seller, deliver);
        let orderId = 1;
        await costDisputeProposal(deliveryInstance, -DEFAULT_ESCROW_VALUE * 2.5, deliver, orderId, 0, 0, 0);
        await acceptCostDisputeProposal(deliveryInstance, seller, -DEFAULT_ESCROW_VALUE, DEFAULT_ESCROW_VALUE * 3.5, orderId, DEFAULT_ESCROW_VALUE * 1.5, DEFAULT_ESCROW_VALUE * 0.5);
    });

    it("Can use the withdraw to pay and there will be withdraw left", async () => {
        await createToAcceptedDisputeWithdrawHelper(deliveryInstance, buyer, seller, deliver);
        let orderId = 1;
        await costDisputeProposal(deliveryInstance, -DEFAULT_ESCROW_VALUE * 1.5, deliver, orderId, 0, 0, 0);
        await acceptCostDisputeProposal(deliveryInstance, seller, -DEFAULT_ESCROW_VALUE * 0.5, DEFAULT_ESCROW_VALUE * 2.5, orderId, DEFAULT_ESCROW_VALUE * 0.5, 0);
    });

    it("Can use the withdraw to pay but need to send the rest", async () => {
        await createToAcceptedDisputeWithdrawHelper(deliveryInstance, buyer, seller, deliver);
        let orderId = 1;
        await costDisputeProposal(deliveryInstance, -DEFAULT_ESCROW_VALUE * 2.5, deliver, orderId, 0, 0, 0);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, seller, -DEFAULT_ESCROW_VALUE, DEFAULT_ESCROW_VALUE * 3.5, orderId, DEFAULT_ESCROW_VALUE * 1.5, 0),
            "User need to send additional cost"
        );
    });

    it("Can use the withdraw to pay but need to send the rest - 2", async () => {
        await createToAcceptedDisputeWithdrawHelper(deliveryInstance, buyer, seller, deliver);
        let orderId = 1;
        await costDisputeProposal(deliveryInstance, -DEFAULT_ESCROW_VALUE * 2.5, deliver, orderId, 0, 0, 0);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, seller, -DEFAULT_ESCROW_VALUE, DEFAULT_ESCROW_VALUE * 3.5, orderId, DEFAULT_ESCROW_VALUE * 1.5, DEFAULT_ESCROW_VALUE * 0.45),
            "User need to send additional cost"
        );
    });
});
