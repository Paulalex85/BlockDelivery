const {createDispute,acceptDisputeProposal} = require('./disputeMethods');

async function createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver, orderId = 0, buyerReceive = undefined) {
    await createDispute(deliveryInstance, seller, buyerReceive, orderId);
    await acceptDisputeProposal(deliveryInstance, false, deliver, orderId);
    await acceptDisputeProposal(deliveryInstance, true, buyer, orderId);
}

Object.assign(exports, {
    createFullAcceptedRefundDispute
});