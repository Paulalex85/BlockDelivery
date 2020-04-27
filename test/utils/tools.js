function generateKeyHash() {
    let key = web3.utils.randomHex(32);
    let hash = web3.utils.keccak256(key);
    return {
        key: key,
        hash: hash
    }
}

async function logContract(deliveryInstance, orderId) {
    let order = await deliveryInstance.getOrder.call(orderId);
    let escrow = await deliveryInstance.getEscrow.call(orderId);
    let dispute = await deliveryInstance.getDispute.call(orderId);

    console.log("");
    console.log("DeliveryContract:");
    console.log("--------------");
    console.log("Buyer : " + order.buyer);
    console.log("Seller : " + order.seller);
    console.log("Deliver : " + order.deliver);
    console.log("Seller Price : " + order.sellerPrice);
    console.log("Deliver Price : " + order.deliverPrice);
    console.log("Order Stage : " + order.orderStage);
    console.log("Buyer validation : " + order.buyerValidation);
    console.log("Seller validation : " + order.sellerValidation);
    console.log("Deliver validation : " + order.deliverValidation);
    console.log("Seller Delivery Pay : " + order.sellerDeliveryPay);
    console.log("Seller hash : " + order.sellerHash);
    console.log("Buyer hash : " + order.buyerHash);
    console.log("Start date : " + order.startDate);
    console.log("--------------");
    console.log("Escrow Delay : " + escrow.delayEscrow);
    console.log("Escrow Buyer : " + escrow.escrowBuyer);
    console.log("Escrow Seller : " + escrow.escrowSeller);
    console.log("Escrow Deliver : " + escrow.escrowDeliver);
    console.log("--------------");
    console.log("Dispute buyerReceive : " + dispute.buyerReceive);
    console.log("Dispute sellerBalance : " + dispute.sellerBalance);
    console.log("Dispute deliverBalance : " + dispute.deliverBalance);
    console.log("Dispute buyerAcceptEscrow : " + dispute.buyerAcceptEscrow);
    console.log("Dispute sellerAcceptEscrow : " + dispute.sellerAcceptEscrow);
    console.log("Dispute deliverAcceptEscrow : " + dispute.deliverAcceptEscrow);

}

Object.assign(exports, {
    logContract,
    generateKeyHash
});