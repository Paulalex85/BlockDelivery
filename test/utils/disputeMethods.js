const truffleAssert = require('truffle-assertions');
const assert = require('assert');
const {SELLER_PRICE, DELIVER_PRICE} = require('./constants');
const {checkEscrowCreationData} = require('./orderMethods');
const {getWithdraw} = require('./withdrawMethods');

async function createDispute(deliveryInstance, sender, buyerReceive = SELLER_PRICE + DELIVER_PRICE, orderId = 0) {
    let order = await deliveryInstance.getOrder.call(orderId);
    let previousStage = order.orderStage;
    let tx = await deliveryInstance.createDispute(
        orderId,
        buyerReceive,
        {from: sender}
    );

    truffleAssert.eventEmitted(tx, 'DisputeStarted', (ev) => {
        return ev.orderId.toNumber() === orderId &&
            ev.buyerProposal.toNumber() === buyerReceive;
    }, 'DisputeStarted should be emitted with correct parameters');

    order = await deliveryInstance.getOrder.call(orderId);
    assert.strictEqual(parseInt(order.orderStage), 6, "Should be stage to Dispute_Refund_Determination");

    if (sender === order.buyer) {
        await checkDisputeCreationData(deliveryInstance, orderId, buyerReceive, true, false, false, previousStage);
    } else if (sender === order.seller) {
        await checkDisputeCreationData(deliveryInstance, orderId, buyerReceive, false, true, false, previousStage);
    } else {
        await checkDisputeCreationData(deliveryInstance, orderId, buyerReceive, false, false, true, previousStage);
    }
}

async function refundProposalDispute(deliveryInstance, sender, buyerReceive = SELLER_PRICE + DELIVER_PRICE, orderId = 0) {
    let dispute = await deliveryInstance.getDispute.call(orderId);
    let tx = await deliveryInstance.refundProposalDispute(
        orderId,
        buyerReceive,
        {from: sender}
    );

    truffleAssert.eventEmitted(tx, 'DisputeRefundProposal', (ev) => {
        return ev.orderId.toNumber() === orderId &&
            ev.buyerProposal.toNumber() === buyerReceive;
    }, 'DisputeRefundProposal should be emitted with correct parameters');

    let order = await deliveryInstance.getOrder.call(orderId);
    assert.strictEqual(parseInt(order.orderStage), 6, "Should be stage to Dispute_Refund_Determination");

    if (sender === order.buyer) {
        await checkDisputeCreationData(deliveryInstance, orderId, buyerReceive, true, false, false, dispute.previousStage);
    } else if (sender === order.seller) {
        await checkDisputeCreationData(deliveryInstance, orderId, buyerReceive, false, true, false, dispute.previousStage);
    } else {
        await checkDisputeCreationData(deliveryInstance, orderId, buyerReceive, false, false, true, dispute.previousStage);
    }
}

async function acceptDisputeProposal(deliveryInstance, shouldBeCostRepartition, sender, orderId = 0) {
    let dispute = await deliveryInstance.getDispute.call(orderId);
    let order = await deliveryInstance.getOrder.call(orderId);
    let escrow = await deliveryInstance.getEscrow.call(orderId);
    let withdrawBalanceBuyerBefore = await deliveryInstance.withdraws.call(order.buyer);
    let tx = await deliveryInstance.acceptDisputeProposal(
        orderId,
        {from: sender}
    );

    let proposalAccepted = false;
    order = await deliveryInstance.getOrder.call(orderId);
    if (shouldBeCostRepartition) {
        assert.strictEqual(parseInt(order.orderStage), 7, "Should be stage to Dispute_Cost_Repartition");
        await checkDisputeCreationData(deliveryInstance, orderId, parseInt(dispute.buyerReceive), true, false, false, dispute.previousStage);

        let withdrawBalanceBuyerAfter = await deliveryInstance.withdraws.call(order.buyer);
        assert.strictEqual(parseInt(escrow.escrowBuyer) + parseInt(dispute.buyerReceive) + parseInt(withdrawBalanceBuyerBefore), parseInt(withdrawBalanceBuyerAfter), "Buyer Withdraw balance after the refund is wrong");

        proposalAccepted = true;
    } else {
        assert.strictEqual(parseInt(order.orderStage), 6, "Should be stage to Dispute_Refund_Determination");
        if (sender === order.buyer) {
            await checkDisputeCreationData(deliveryInstance, orderId, parseInt(dispute.buyerReceive), true, dispute.sellerAcceptEscrow, dispute.deliverAcceptEscrow, dispute.previousStage);
        } else if (sender === order.seller) {
            await checkDisputeCreationData(deliveryInstance, orderId, parseInt(dispute.buyerReceive), dispute.buyerAcceptEscrow, true, dispute.deliverAcceptEscrow, dispute.previousStage);
        } else {
            await checkDisputeCreationData(deliveryInstance, orderId, parseInt(dispute.buyerReceive), dispute.buyerAcceptEscrow, dispute.sellerAcceptEscrow, true, dispute.previousStage);
        }
    }

    truffleAssert.eventEmitted(tx, 'AcceptProposal', (ev) => {
        return ev.orderId.toNumber() === orderId &&
            ev.user === sender &&
            ev.proposalAccepted === proposalAccepted;
    }, 'AcceptProposal should be emitted with correct parameters');
}

async function costDisputeProposal(deliveryInstance, sellerBalance, deliverBalance, sender, orderId = 0, shouldAddEscrow = 0, msgValue = 0, withdrawShouldBe = 0) {
    let dispute = await deliveryInstance.getDispute.call(orderId);
    let order = await deliveryInstance.getOrder.call(orderId);
    let escrow = await deliveryInstance.getEscrow.call(orderId);
    let tx = await deliveryInstance.costDisputeProposal(
        orderId,
        sellerBalance,
        deliverBalance,
        {from: sender, value: msgValue}
    );

    let withdrawBalance = await deliveryInstance.withdraws.call(sender);
    assert.strictEqual(parseInt(withdrawBalance), withdrawShouldBe, "Wrong withdraw balance");

    if (sender === order.deliver) {
        await checkDisputeCreationData(deliveryInstance, orderId, parseInt(dispute.buyerReceive), true, false, true, dispute.previousStage, sellerBalance, deliverBalance);
        await checkEscrowCreationData(deliveryInstance, orderId, parseInt(escrow.delayEscrow), parseInt(escrow.escrowBuyer), parseInt(escrow.escrowSeller), parseInt(escrow.escrowDeliver) + shouldAddEscrow);
    } else if (sender === order.seller) {
        await checkDisputeCreationData(deliveryInstance, orderId, parseInt(dispute.buyerReceive), true, true, false, dispute.previousStage, sellerBalance, deliverBalance);
        await checkEscrowCreationData(deliveryInstance, orderId, parseInt(escrow.delayEscrow), parseInt(escrow.escrowBuyer), parseInt(escrow.escrowSeller) + shouldAddEscrow, parseInt(escrow.escrowDeliver));
    } else {
        assert.ok(false, "Wrong sender")
    }

    truffleAssert.eventEmitted(tx, 'DisputeCostProposal', (ev) => {
        return ev.orderId.toNumber() === orderId &&
            parseInt(ev.sellerBalance) === sellerBalance &&
            parseInt(ev.deliverBalance) === deliverBalance;
    }, 'DisputeCostProposal should be emitted with correct parameters');
}

async function acceptCostDisputeProposal(deliveryInstance, sender, addWithdrawSeller, addWithdrawDeliver, orderId = 0, shouldAddEscrow = 0, msgValue = 0) {
    let dispute = await deliveryInstance.getDispute.call(orderId);
    let order = await deliveryInstance.getOrder.call(orderId);
    let escrow = await deliveryInstance.getEscrow.call(orderId);
    let withdrawBefore = await getWithdraw(deliveryInstance, order.buyer, order.seller, order.deliver);
    let tx = await deliveryInstance.acceptCostProposal(
        orderId,
        {from: sender, value: msgValue}
    );

    let withdrawAfter = await getWithdraw(deliveryInstance, order.buyer, order.seller, order.deliver);
    assert.strictEqual(withdrawAfter.deliver, withdrawBefore.deliver + addWithdrawDeliver, "Wrong deliver withdraw balance");
    assert.strictEqual(withdrawAfter.seller, withdrawBefore.seller + addWithdrawSeller, "Wrong seller withdraw balance");
    assert.strictEqual(withdrawAfter.buyer, withdrawBefore.buyer, "Wrong buyer withdraw balance");

    if (sender === order.deliver) {
        await checkDisputeCreationData(deliveryInstance, orderId, parseInt(dispute.buyerReceive), true, true, true, dispute.previousStage, parseInt(dispute.sellerBalance), parseInt(dispute.deliverBalance));
        await checkEscrowCreationData(deliveryInstance, orderId, parseInt(escrow.delayEscrow), parseInt(escrow.escrowBuyer), parseInt(escrow.escrowSeller), parseInt(escrow.escrowDeliver) + shouldAddEscrow);
    } else if (sender === order.seller) {
        await checkDisputeCreationData(deliveryInstance, orderId, parseInt(dispute.buyerReceive), true, true, true, dispute.previousStage, parseInt(dispute.sellerBalance), parseInt(dispute.deliverBalance));
        await checkEscrowCreationData(deliveryInstance, orderId, parseInt(escrow.delayEscrow), parseInt(escrow.escrowBuyer), parseInt(escrow.escrowSeller) + shouldAddEscrow, parseInt(escrow.escrowDeliver));
    } else {
        assert.ok(false, "Wrong sender")
    }

    order = await deliveryInstance.getOrder.call(orderId);
    assert.strictEqual(parseInt(order.orderStage), 5, "Should be stage to cancel order");

    truffleAssert.eventEmitted(tx, 'CancelOrder', (ev) => {
        return ev.orderId.toNumber() === orderId &&
            ev.startedOrder === true;
    }, 'CancelOrder should be emitted with correct parameters');
}

async function revertDispute(deliveryInstance, sender, orderId = 0) {
    let dispute = await deliveryInstance.getDispute.call(orderId);
    let tx = await deliveryInstance.revertDispute(
        orderId,
        {from: sender}
    );

    let order = await deliveryInstance.getOrder.call(orderId);
    assert.strictEqual(parseInt(order.orderStage), parseInt(dispute.previousStage), "Should be previous stage : " + dispute.previousStage);

    truffleAssert.eventEmitted(tx, 'RevertDispute', (ev) => {
        return ev.orderId.toNumber() === orderId &&
            ev.user === sender;
    }, 'RevertDispute should be emitted with correct parameters');
}

async function checkDisputeCreationData(deliveryInstance, orderId, buyerReceive, buyerAcceptEscrow, sellerAcceptEscrow, deliverAcceptEscrow, previousStage, sellerBalance = 0, deliverBalance = 0) {
    let dispute = await deliveryInstance.getDispute.call(orderId);

    assert.strictEqual(parseInt(dispute.buyerReceive), buyerReceive, "Should be this buyerReceive : " + buyerReceive);
    assert.strictEqual(parseInt(dispute.sellerBalance), sellerBalance, "Should be this sellerBalance : " + sellerBalance);
    assert.strictEqual(parseInt(dispute.deliverBalance), deliverBalance, "Should be this deliverBalance : " + deliverBalance);
    assert.strictEqual(parseInt(dispute.previousStage), parseInt(previousStage), "Should be previous stage : " + previousStage);
    assert.strictEqual(dispute.buyerAcceptEscrow, buyerAcceptEscrow, "buyerAcceptEscrow should be : " + buyerAcceptEscrow);
    assert.strictEqual(dispute.sellerAcceptEscrow, sellerAcceptEscrow, "sellerAcceptEscrow should be : " + sellerAcceptEscrow);
    assert.strictEqual(dispute.deliverAcceptEscrow, deliverAcceptEscrow, "deliverAcceptEscrow should be : " + deliverAcceptEscrow);
}

Object.assign(exports, {
    createDispute,
    refundProposalDispute,
    acceptDisputeProposal,
    costDisputeProposal,
    revertDispute,
    acceptCostDisputeProposal
});