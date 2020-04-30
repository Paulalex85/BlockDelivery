const {validateOrder, createOrder, takeOrder, deliverOrder, endOrder} = require('./orderMethods');
const {actors, DEFAULT_ESCROW_VALUE, SELLER_PRICE, DELIVER_PRICE} = require('./constants');

async function completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId, sellerDeliveryPay = 0) {
    let keyHashSeller = await validateOrder(deliveryInstance,
        actors.SELLER,
        seller,
        DEFAULT_ESCROW_VALUE * 2 + sellerDeliveryPay,
        orderId,
        false,
        false,
        true,
        false);
    await validateOrder(deliveryInstance,
        actors.DELIVER,
        deliver,
        DEFAULT_ESCROW_VALUE * 3,
        orderId,
        false,
        false,
        true,
        true);
    let keyHashBuyer = await validateOrder(deliveryInstance,
        actors.BUYER,
        buyer,
        DELIVER_PRICE + SELLER_PRICE + DEFAULT_ESCROW_VALUE - sellerDeliveryPay,
        orderId,
        true,
        true,
        true,
        true);

    return {keyHashSeller, keyHashBuyer};
}

async function createToDeliver(deliveryInstance, buyer, seller, deliver, orderId, sellerDeliveryPay = 0) {
    await createOrder(deliveryInstance, buyer, seller, deliver, buyer, orderId, undefined, undefined, undefined, undefined, undefined, undefined, sellerDeliveryPay);
    let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId, sellerDeliveryPay);
    await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
    await deliverOrder(deliveryInstance, orderId, keyHashBuyer.key, deliver);
}

async function fullDeliveredOrder(deliveryInstance, buyer, seller, deliver, orderId) {
    await createToDeliver(deliveryInstance, buyer, seller, deliver, orderId);
    await endOrder(deliveryInstance, buyer, seller, deliver, orderId, buyer);
}


Object.assign(exports, {
    fullDeliveredOrder,
    completeValidationOrder,
    createToDeliver,
});