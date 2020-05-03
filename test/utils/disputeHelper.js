const {createDispute, acceptDisputeProposal} = require('./disputeMethods');
const {validateOrder, createOrder,takeOrder} = require('./orderMethods');
const {increaseWithdraw, completeValidationOrder} = require('./orderHelper');
const {DEFAULT_ESCROW_VALUE, DELIVER_PRICE, SELLER_PRICE, actors} = require('../utils/constants');

async function costDisputeTestHelper(deliveryInstance, buyer, seller, deliver) {
    await createOrder(deliveryInstance, buyer, seller, deliver, deliver, undefined, undefined, undefined, undefined, undefined, undefined, undefined, DELIVER_PRICE);
    let orderId = 0;
    let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId, DELIVER_PRICE);
    await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
    await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver, orderId, SELLER_PRICE);
}

async function createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver, orderId = 0, buyerReceive = undefined) {
    await createDispute(deliveryInstance, seller, buyerReceive, orderId);
    await acceptDisputeProposal(deliveryInstance, false, deliver, orderId);
    await acceptDisputeProposal(deliveryInstance, true, buyer, orderId);
}

async function createToAcceptedDisputeWithdrawHelper(deliveryInstance, buyer, seller, deliver, sellerDeliveryPay = 0) {
    await increaseWithdraw(deliveryInstance, buyer, seller, deliver, seller, 0, DEFAULT_ESCROW_VALUE);

    let orderId = 1;
    await createOrder(deliveryInstance, buyer, seller, deliver, buyer, orderId, DEFAULT_ESCROW_VALUE, DEFAULT_ESCROW_VALUE, undefined, 0, DEFAULT_ESCROW_VALUE, DEFAULT_ESCROW_VALUE, sellerDeliveryPay);

    await validateOrder(deliveryInstance,
        actors.SELLER,
        seller,
        DEFAULT_ESCROW_VALUE + sellerDeliveryPay,
        orderId,
        false,
        false,
        true,
        false,
        DEFAULT_ESCROW_VALUE);
    await validateOrder(deliveryInstance,
        actors.DELIVER,
        deliver,
        DEFAULT_ESCROW_VALUE,
        orderId,
        false,
        false,
        true,
        true);
    await validateOrder(deliveryInstance,
        actors.BUYER,
        buyer,
        DEFAULT_ESCROW_VALUE * 2 - sellerDeliveryPay,
        orderId,
        true,
        true,
        true,
        true);
    await createFullAcceptedRefundDispute(deliveryInstance, buyer, seller, deliver, orderId, DEFAULT_ESCROW_VALUE * 2);
}

Object.assign(exports, {
    createFullAcceptedRefundDispute,
    createToAcceptedDisputeWithdrawHelper,
    costDisputeTestHelper
});