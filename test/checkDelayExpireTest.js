const truffleAssert = require('truffle-assertions');
const {createOrder, updateInitializeOrder, validateOrder, takeOrder, initCancelOrder, deliverOrder, endOrder} = require("./utils/orderMethods");
const {revertDispute, createDispute, refundProposalDispute, acceptDisputeProposal, acceptCostDisputeProposal, costDisputeProposal} = require("./utils/disputeMethods");
const {completeValidationOrder, createToDeliver} = require("./utils/orderHelper");
const {createFullAcceptedRefundDispute} = require("./utils/disputeHelper");
const {advanceTimeAndBlock} = require("./utils/timeHelper");
const DeliveryContract = artifacts.require("DeliveryContract");
const {SELLER_PRICE, DELIVER_PRICE, DELAY_ORDER, actors} = require('./utils/constants');

contract("check delay method of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;
    let dayAndSecond = 60 * 60 * 24 + 1;
    let defaultEscrow = DELIVER_PRICE + SELLER_PRICE;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[0];
        seller = accounts[1];
        deliver = accounts[2];
    });

    it("Delay can expire in take order method ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await advanceTimeAndBlock(dayAndSecond);
        await truffleAssert.reverts(
            takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver),
            "Delay of the order is passed"
        );
    });

    it("Delay can expire in delivery order method ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);

        await advanceTimeAndBlock(dayAndSecond);
        await truffleAssert.reverts(
            deliverOrder(deliveryInstance, 0, keyHashBuyer.key, deliver),
            "Delay of the order is passed"
        );
    });

    it("Delay can expire in end order method ", async () => {
        let orderId = 0;
        await createToDeliver(deliveryInstance, buyer, seller, deliver, orderId);

        await advanceTimeAndBlock(dayAndSecond);
        await truffleAssert.reverts(
            endOrder(deliveryInstance, buyer, seller, deliver, orderId, buyer),
            "Delay of the order is passed"
        );
    });

    it("Delay can expire in create dispute order method ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await advanceTimeAndBlock(dayAndSecond);
        await truffleAssert.reverts(
            createDispute(deliveryInstance, buyer),
            "Delay of the order is passed"
        );
    });


    it("Delay can expire in refund proposal dispute order method ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await createDispute(deliveryInstance, buyer);
        await advanceTimeAndBlock(dayAndSecond);
        await truffleAssert.reverts(
            refundProposalDispute(deliveryInstance, buyer),
            "Delay of the order is passed"
        );
    });

    it("Delay can expire in accept dispute proposal order method ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await createDispute(deliveryInstance, buyer);
        await advanceTimeAndBlock(dayAndSecond);
        await truffleAssert.reverts(
            acceptDisputeProposal(deliveryInstance, false, buyer),
            "Delay of the order is passed"
        );
    });

    it("Delay can expire in cost dispute proposal order method ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await advanceTimeAndBlock(dayAndSecond);
        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, -SELLER_PRICE, -DELIVER_PRICE, seller),
            "Delay of the order is passed"
        );
    });

    it("Delay can expire in accept cost dispute proposal order method ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver);
        await costDisputeProposal(deliveryInstance, -SELLER_PRICE, -DELIVER_PRICE, seller);
        await advanceTimeAndBlock(dayAndSecond);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, seller, defaultEscrow * 2, defaultEscrow * 3),
            "Delay of the order is passed"
        );
    });

    it("Delay can expire in revert dispute order method ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await createDispute(deliveryInstance, buyer);
        await advanceTimeAndBlock(dayAndSecond);
        await truffleAssert.reverts(
            revertDispute(deliveryInstance, deliver),
            "Delay of the order is passed"
        );
    });

    it("Methods can't fail with delay ", async () => {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer);
        let orderId = 0;

        await advanceTimeAndBlock(dayAndSecond);
        await validateOrder(deliveryInstance,
            actors.BUYER,
            buyer,
            SELLER_PRICE + DELIVER_PRICE + defaultEscrow,
            0,
            false,
            true,
            false,
            false);
        await advanceTimeAndBlock(dayAndSecond);
        await validateOrder(deliveryInstance,
            actors.SELLER,
            seller,
            defaultEscrow * 2,
            0,
            false,
            true,
            true,
            false);
        await advanceTimeAndBlock(dayAndSecond);
        await initCancelOrder(deliveryInstance, buyer, seller, deliver, buyer);

        orderId = 1;
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer, orderId);
        await advanceTimeAndBlock(dayAndSecond);
        await validateOrder(deliveryInstance,
            actors.DELIVER,
            deliver,
            defaultEscrow * 3,
            orderId,
            false,
            false,
            false,
            true);

        await advanceTimeAndBlock(dayAndSecond);
        await updateInitializeOrder(deliveryInstance,
            buyer,
            seller,
            deliver,
            54545,
            68781,
            DELAY_ORDER * 2,
            buyer,
            orderId,
            6141154,
            654625 * 2,
            15401 * 3);
    });
});
