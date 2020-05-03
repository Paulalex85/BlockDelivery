const {validateOrder, createOrder, takeOrder, deliverOrder, endOrder, initCancelOrder} = require('./orderMethods');
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

async function increaseWithdraw(deliveryInstance, buyer, seller, deliver, sender, orderId = 0, withdrawToAdd = DEFAULT_ESCROW_VALUE) {
    if (sender === buyer) {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer, orderId, withdrawToAdd, 0, undefined, 0, 0, 0, undefined);
        await validateOrder(deliveryInstance,
            actors.BUYER,
            buyer,
            withdrawToAdd,
            orderId,
            false,
            true,
            false,
            false);
    } else if (sender === seller) {
        await createOrder(deliveryInstance, buyer, seller, deliver, buyer, orderId, 0, 0, undefined, 0, withdrawToAdd, 0, undefined);
        await validateOrder(deliveryInstance,
            actors.SELLER,
            seller,
            withdrawToAdd,
            orderId,
            false,
            false,
            true,
            false);
    }
    await initCancelOrder(deliveryInstance, buyer, seller, deliver, buyer);
}

async function createToDeliver(deliveryInstance, buyer, seller, deliver, orderId, sellerPrice = 0, sellerDeliveryPay = 0) {
    await createOrder(deliveryInstance, buyer, seller, deliver, buyer, orderId, undefined, undefined, undefined, undefined, undefined, undefined, sellerDeliveryPay);
    let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId, sellerDeliveryPay);
    await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
    await deliverOrder(deliveryInstance, orderId, keyHashBuyer.key, deliver);
}

async function fullDeliveredOrder(deliveryInstance, buyer, seller, deliver, orderId) {
    await createToDeliver(deliveryInstance, buyer, seller, deliver, orderId);
    await endOrder(deliveryInstance, buyer, seller, deliver, orderId, buyer);
}

async function validationWithdrawTest(deliveryInstance, buyer, seller, deliver, withdrawAmount, msgValue, withdrawShouldBe, buyerAdditionalCost = 0) {
    await increaseWithdraw(deliveryInstance, buyer, seller, deliver, buyer, 0, withdrawAmount);
    let orderId = 1;
    await createOrder(deliveryInstance, buyer, seller, deliver, buyer, orderId, undefined, undefined, undefined, buyerAdditionalCost, 0, 0, 0);
    await validateOrder(deliveryInstance,
        actors.BUYER,
        buyer,
        msgValue,
        orderId,
        false,
        true,
        false,
        false,
        withdrawShouldBe);
}


Object.assign(exports, {
    fullDeliveredOrder,
    completeValidationOrder,
    createToDeliver,
    validationWithdrawTest,
    increaseWithdraw,
});