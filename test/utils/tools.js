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

    console.log("");
    console.log("DeliveryContract:");
    console.log("--------------");
    console.log("Buyer : " + order.buyer);
    console.log("Seller : " + order.seller);
    console.log("Deliver : " + order.deliver);
    console.log("Seller Price : " + order.sellerPrice);
    console.log("Deliver Price : " + order.deliverPrice);
    console.log("Order Stage : " + order.orderStage);
    console.log("Date delay : " + order.delayEscrow);
    console.log("Buyer validation : " + order.buyerValidation);
    console.log("Seller validation : " + order.sellerValidation);
    console.log("Deliver validation : " + order.deliverValidation);
    console.log("Seller hash : " + order.sellerHash);
    console.log("Buyer hash : " + order.buyerHash);
    console.log("--------------");
}

Object.assign(exports, {
    logContract,
    generateKeyHash
});