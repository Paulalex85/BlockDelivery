const truffleAssert = require('truffle-assertions');
const {createOrder, takeOrder, deliverOrder} = require("../utils/orderMethods");
const {createDispute, refundProposalDispute} = require("../utils/disputeMethods");
const {completeValidationOrder} = require("../utils/orderHelper");
const DeliveryContract = artifacts.require("DeliveryContract");
const {SELLER_PRICE, DELIVER_PRICE} = require('../utils/constants');

contract("refundProposalDispute method of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[3];
        seller = accounts[1];
        deliver = accounts[2];
    });

    it("Buyer can refund proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, buyer);
        await refundProposalDispute(deliveryInstance, buyer);
    });

    it("Seller can refund proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, buyer);
        await refundProposalDispute(deliveryInstance, seller);
    });

    it("Deliver can refund proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, buyer);
        await refundProposalDispute(deliveryInstance, deliver);
    });

    it("Another actor can't refund proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, buyer);
        await truffleAssert.reverts(
            refundProposalDispute(deliveryInstance, accounts[9]),
            "Should be an actor of the order"
        );
    });

    it("Can call twice ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, buyer);
        await refundProposalDispute(deliveryInstance, buyer);
        await refundProposalDispute(deliveryInstance, buyer);
    });

    it("BuyerReceive can be less than what he paid ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await createDispute(deliveryInstance, buyer, SELLER_PRICE);
        await refundProposalDispute(deliveryInstance, deliver, DELIVER_PRICE);
    });

    it("Can't refund proposal at wrong stage  ", async () => {
        let orderId = 0;
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await truffleAssert.reverts(
            refundProposalDispute(deliveryInstance, buyer),
            "The order isn't at the required stage"
        );

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await truffleAssert.reverts(
            refundProposalDispute(deliveryInstance, buyer),
            "The order isn't at the required stage"
        );

        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await truffleAssert.reverts(
            refundProposalDispute(deliveryInstance, buyer),
            "The order isn't at the required stage"
        );

        await deliverOrder(deliveryInstance,  0, keyHashBuyer.key, deliver);
        await truffleAssert.reverts(
            refundProposalDispute(deliveryInstance, buyer),
            "The order isn't at the required stage"
        );
    });

    it("BuyerReceive can't be upper than what he paid ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await createDispute(deliveryInstance, buyer);
        await truffleAssert.reverts(
            refundProposalDispute(deliveryInstance, buyer, SELLER_PRICE + DELIVER_PRICE + 100),
            "Buyer can't receive more than he has paid"
        );
    });
});
