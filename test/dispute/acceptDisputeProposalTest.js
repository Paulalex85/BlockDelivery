const truffleAssert = require('truffle-assertions');
const {createOrder, completeValidationOrder, takeOrder, createDispute, acceptDisputeProposal, deliverOrder} = require("../utils/orderMethods");
const DeliveryContract = artifacts.require("DeliveryContract");

contract("acceptDisputeProposal method of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[0];
        seller = accounts[1];
        deliver = accounts[2];
    });

    it("Buyer can accept dispute proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, seller);
        await acceptDisputeProposal(deliveryInstance, false, buyer);
    });

    it("Seller can accept dispute proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, buyer);
        await acceptDisputeProposal(deliveryInstance, false, seller);
    });

    it("Deliver can accept dispute proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, buyer);
        await acceptDisputeProposal(deliveryInstance, false, deliver);
    });

    it("Buyer can end dispute proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, seller);
        await acceptDisputeProposal(deliveryInstance, false, deliver);
        await acceptDisputeProposal(deliveryInstance, true, buyer);
    });

    it("Seller can end dispute proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, deliver);
        await acceptDisputeProposal(deliveryInstance, false, buyer);
        await acceptDisputeProposal(deliveryInstance, true, seller);
    });

    it("Deliver can end dispute proposal ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, buyer);
        await acceptDisputeProposal(deliveryInstance, false, seller);
        await acceptDisputeProposal(deliveryInstance, true, deliver);
    });

    it("Buyer can't accept twice ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, buyer);
        await truffleAssert.reverts(
            acceptDisputeProposal(deliveryInstance, false, buyer),
            "Buyer already accept dispute"
        );
    });

    it("Seller can't accept twice ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, seller);
        await truffleAssert.reverts(
            acceptDisputeProposal(deliveryInstance, false, seller),
            "Seller already accept dispute"
        );
    });

    it("Deliver can't accept twice ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, deliver);
        await truffleAssert.reverts(
            acceptDisputeProposal(deliveryInstance, false, deliver),
            "Deliver already accept dispute"
        );
    });


    it("Another actor can't accept a dispute ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await createDispute(deliveryInstance, seller);
        await truffleAssert.reverts(
            acceptDisputeProposal(deliveryInstance, false, accounts[3]),
            "Should be an actor of the order"
        );
    });

    it("Can't accept proposal at wrong stage ", async () => {
        let orderId = 0;
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        await truffleAssert.reverts(
            acceptDisputeProposal(deliveryInstance, false, buyer),
            "Order should be Refund Determination stage"
        );

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await truffleAssert.reverts(
            acceptDisputeProposal(deliveryInstance, false, buyer),
            "Order should be Refund Determination stage"
        );

        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
        await truffleAssert.reverts(
            acceptDisputeProposal(deliveryInstance, false, buyer),
            "Order should be Refund Determination stage"
        );

        await deliverOrder(deliveryInstance, buyer, seller, deliver, 0, keyHashBuyer.key, deliver);
        await truffleAssert.reverts(
            acceptDisputeProposal(deliveryInstance, false, buyer),
            "Order should be Refund Determination stage"
        );
    });

});