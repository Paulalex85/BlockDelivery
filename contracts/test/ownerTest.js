const truffleAssert = require('truffle-assertions');
const assert = require('assert');
const {withdrawBalance} = require("./utils/withdrawMethods");
const {updateOwner, pause, unpause} = require("./utils/ownerMethods");
const {fullDeliveredOrder, completeValidationOrder} = require("./utils/orderHelper");
const {createOrder, endOrder, deliverOrder, takeOrder} = require("./utils/orderMethods");
const {createDispute, acceptDisputeProposal, refundProposalDispute, costDisputeProposal, acceptCostDisputeProposal, revertDispute} = require("./utils/disputeMethods");
const DeliveryContract = artifacts.require("DeliveryContract");
const {DEFAULT_ESCROW_VALUE, SELLER_PRICE} = require('./utils/constants');

contract("Owner test method of DeliveryContract", accounts => {

    let deliveryInstance, buyer, seller, deliver;

    beforeEach(async function () {
        deliveryInstance = await DeliveryContract.new();
        buyer = accounts[3];
        seller = accounts[1];
        deliver = accounts[2];
    });

    it("Withdraw balance of owner after change address ", async () => {
        await fullDeliveredOrder(deliveryInstance, buyer, seller, deliver, 0);

        await withdrawBalance(deliveryInstance, buyer);
        await withdrawBalance(deliveryInstance, deliver);
        await withdrawBalance(deliveryInstance, seller);
        await withdrawBalance(deliveryInstance, accounts[0]);

        let newOwner = accounts[4];
        await updateOwner(deliveryInstance, newOwner, accounts[0]);

        await fullDeliveredOrder(deliveryInstance, buyer, seller, deliver, 1);

        let withdrawBalanceOwnerBefore = await deliveryInstance.withdraws.call(accounts[0]);
        assert.strictEqual(parseInt(withdrawBalanceOwnerBefore), 0, "The old balance owner should be empty");
        let withdrawBalanceOwnerNow = await deliveryInstance.withdraws.call(newOwner);
        assert.strictEqual(parseInt(withdrawBalanceOwnerNow), DEFAULT_ESCROW_VALUE * 0.01, "The new balance owner should be filled");
        await withdrawBalance(deliveryInstance, newOwner);
    });

    it("Can't change the owner if from another address ", async () => {
        let newOwner = accounts[4];
        await truffleAssert.reverts(
            updateOwner(deliveryInstance, newOwner, buyer),
            "Not the owner"
        );
    });

    it("Can't change the owner if from another address ", async () => {
        let newOwner = '0x0000000000000000000000000000000000000000';
        await truffleAssert.reverts(
            updateOwner(deliveryInstance, newOwner, accounts[0]),
            "New address need to be defined"
        );
    });

    it("Owner can pause the contract ", async () => {
        let orderId = 0;
        await pause(deliveryInstance, accounts[0]);
        await truffleAssert.reverts(
            createOrder(deliveryInstance, buyer, seller, deliver, buyer, orderId),
            "Pausable: paused"
        );
        await unpause(deliveryInstance, accounts[0]);
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer, orderId);

        await pause(deliveryInstance, accounts[0]);
        await truffleAssert.reverts(
            completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId),
            "Pausable: paused"
        );
        await unpause(deliveryInstance, accounts[0]);
        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);

        await pause(deliveryInstance, accounts[0]);
        await truffleAssert.reverts(
            takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver),
            "Pausable: paused"
        );
        await unpause(deliveryInstance, accounts[0]);
        await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);

        await pause(deliveryInstance, accounts[0]);
        await truffleAssert.reverts(
            deliverOrder(deliveryInstance, orderId, keyHashBuyer.key, deliver),
            "Pausable: paused"
        );
        await unpause(deliveryInstance, accounts[0]);
        await deliverOrder(deliveryInstance, orderId, keyHashBuyer.key, deliver);

        await pause(deliveryInstance, accounts[0]);
        await truffleAssert.reverts(
            endOrder(deliveryInstance, buyer, seller, deliver, orderId, buyer),
            "Pausable: paused"
        );
        await unpause(deliveryInstance, accounts[0]);
        await endOrder(deliveryInstance, buyer, seller, deliver, orderId, buyer);

        await pause(deliveryInstance, accounts[0]);
        await truffleAssert.reverts(
            withdrawBalance(deliveryInstance, seller),
            "Pausable: paused"
        );
        await unpause(deliveryInstance, accounts[0]);
        await withdrawBalance(deliveryInstance, seller);
    });

    it("Owner can pause the contract - 2 ", async () => {
        let orderId = 0;
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer, orderId);
        let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);

        await pause(deliveryInstance, accounts[0]);
        await truffleAssert.reverts(
            createDispute(deliveryInstance, seller),
            "Pausable: paused"
        );
        await unpause(deliveryInstance, accounts[0]);
        await createDispute(deliveryInstance, seller);

        await pause(deliveryInstance, accounts[0]);
        await truffleAssert.reverts(
            acceptDisputeProposal(deliveryInstance, false, deliver, orderId),
            "Pausable: paused"
        );
        await unpause(deliveryInstance, accounts[0]);

        await pause(deliveryInstance, accounts[0]);
        await truffleAssert.reverts(
            refundProposalDispute(deliveryInstance, buyer),
            "Pausable: paused"
        );
        await unpause(deliveryInstance, accounts[0]);
        await refundProposalDispute(deliveryInstance, buyer);

        await acceptDisputeProposal(deliveryInstance, false, deliver, orderId);
        await acceptDisputeProposal(deliveryInstance, true, seller, orderId);

        await pause(deliveryInstance, accounts[0]);
        await truffleAssert.reverts(
            costDisputeProposal(deliveryInstance, -SELLER_PRICE + DEFAULT_ESCROW_VALUE / 2, deliver),
            "Pausable: paused"
        );
        await unpause(deliveryInstance, accounts[0]);
        await costDisputeProposal(deliveryInstance, -SELLER_PRICE + DEFAULT_ESCROW_VALUE / 2, deliver);

        await pause(deliveryInstance, accounts[0]);
        await truffleAssert.reverts(
            acceptCostDisputeProposal(deliveryInstance, seller, DEFAULT_ESCROW_VALUE * 2, DEFAULT_ESCROW_VALUE * 3),
            "Pausable: paused"
        );
        await unpause(deliveryInstance, accounts[0]);
        await acceptCostDisputeProposal(deliveryInstance, seller, DEFAULT_ESCROW_VALUE * 2, DEFAULT_ESCROW_VALUE * 3);
    });

    it("Owner can pause the contract - 3 ", async () => {
        let orderId = 0;
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer, orderId);
        await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
        await createDispute(deliveryInstance, seller);

        await pause(deliveryInstance, accounts[0]);
        await truffleAssert.reverts(
            revertDispute(deliveryInstance, buyer),
            "Pausable: paused"
        );
        await unpause(deliveryInstance, accounts[0]);
        await revertDispute(deliveryInstance, buyer);
    });

    it("Can't pause if not owner ", async () => {
        await truffleAssert.reverts(
            pause(deliveryInstance, buyer),
            "Not the owner"
        );
        await pause(deliveryInstance, accounts[0]);
        await truffleAssert.reverts(
            unpause(deliveryInstance, buyer),
            "Not the owner"
        );
        await unpause(deliveryInstance, accounts[0]);
    });
});
