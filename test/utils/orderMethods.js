const truffleAssert = require('truffle-assertions');
const assert = require('assert');
const {SELLER_PRICE, DELIVER_PRICE, DELAY_ORDER, DEFAULT_HASH, actors} = require('./constants');
const {getWithdraw, checkWithdrawUpdate} = require('./withdrawMethods');
const {generateKeyHash, logContract} = require('./tools');
const DEFAULT_ESCROW_VALUE = SELLER_PRICE + DELIVER_PRICE;

async function createOrder(deliveryInstance, buyer, seller, deliver, sender, orderId = 0, sellerPrice = SELLER_PRICE, deliverPrice = DELIVER_PRICE, delayEscrow = DELAY_ORDER, escrowBuyer = DEFAULT_ESCROW_VALUE, escrowSeller = DEFAULT_ESCROW_VALUE * 2, escrowDeliver = DEFAULT_ESCROW_VALUE * 3, sellerDeliveryPay = 0) {
    let tx = await deliveryInstance.createOrder(
        [buyer, seller, deliver],
        sellerPrice,
        deliverPrice,
        sellerDeliveryPay,
        delayEscrow,
        [escrowBuyer, escrowSeller, escrowDeliver],
        {from: sender}
    );

    truffleAssert.eventEmitted(tx, 'NewOrder', (ev) => {
        return ev.buyer === buyer
            && ev.seller === seller
            && ev.deliver === deliver
            && ev.orderId.toNumber() === orderId;
    }, 'NewOrder should be emitted with correct parameters');
    await checkOrderCreationData(deliveryInstance, orderId, buyer, seller, deliver, sellerPrice, deliverPrice, DEFAULT_HASH, DEFAULT_HASH, sellerDeliveryPay);
    await checkEscrowCreationData(deliveryInstance, orderId, delayEscrow, escrowBuyer, escrowSeller, escrowDeliver);
}


async function updateInitializeOrder(deliveryInstance, buyer, seller, deliver, sellerPrice, deliverPrice, delayEscrow = DELAY_ORDER, sender, orderId = 0, escrowBuyer = DEFAULT_ESCROW_VALUE, escrowSeller = DEFAULT_ESCROW_VALUE * 2, escrowDeliver = DEFAULT_ESCROW_VALUE * 3, sellerDeliveryPay = 0) {
    let order = await deliveryInstance.getOrder.call(orderId);
    let escrow = await deliveryInstance.getEscrow.call(orderId);
    let withdrawBefore = await getWithdraw(deliveryInstance, buyer, seller, deliver);
    let tx = await deliveryInstance.updateInitializeOrder(
        orderId,
        sellerPrice,
        deliverPrice,
        sellerDeliveryPay,
        delayEscrow,
        [escrowBuyer, escrowSeller, escrowDeliver],
        {from: sender}
    );

    truffleAssert.eventEmitted(tx, 'OrderUpdated', (ev) => {
        return ev.orderId.toNumber() === orderId;
    }, 'OrderUpdated should be emitted with correct parameters');

    await checkWithdrawUpdate(deliveryInstance, buyer, seller, deliver, order, withdrawBefore, escrow);
    await checkOrderCreationData(deliveryInstance, orderId, buyer, seller, deliver, sellerPrice, deliverPrice, order.sellerHash, order.buyerHash, sellerDeliveryPay);
    await checkEscrowCreationData(deliveryInstance, orderId, delayEscrow, escrowBuyer, escrowSeller, escrowDeliver);
}

async function validateOrder(deliveryInstance, typeValidation, sender, amountEth, orderId, shouldBeStarted, buyerValidation, sellerValidation, deliverValidation) {
    let keyHash = generateKeyHash();

    let tx = "";
    if (typeValidation === actors.SELLER || typeValidation === actors.BUYER) {
        tx = await deliveryInstance.validateOrder(
            orderId,
            keyHash.hash,
            {from: sender, value: amountEth}
        );
    } else if (typeValidation === actors.DELIVER) {
        tx = await deliveryInstance.validateOrder(
            orderId,
            "0x0",
            {from: sender, value: amountEth}
        );
    }

    truffleAssert.eventEmitted(tx, 'OrderValidate', (ev) => {
        return ev.orderId.toNumber() === orderId
            && ev.user === sender
            && ev.isOrderStarted === shouldBeStarted;
    }, 'OrderValidate should be emitted with correct parameters');

    let order = await deliveryInstance.getOrder.call(orderId);
    assert.strictEqual(order.buyerValidation, buyerValidation, "Buyer validation problem");
    assert.strictEqual(order.sellerValidation, sellerValidation, "Seller validation problem");
    assert.strictEqual(order.deliverValidation, deliverValidation, "Deliver validation problem");

    if (typeValidation === actors.SELLER) {
        assert.strictEqual(order.sellerHash, keyHash.hash, "Seller hash should be set");
    } else if (typeValidation === actors.BUYER) {
        assert.strictEqual(order.buyerHash, keyHash.hash, "Buyer hash should be set");
    }

    if (shouldBeStarted) {
        assert.strictEqual(order.orderStage.toNumber(), 1, "Should be stage started");
        assert.ok(parseInt(order.startDate) > 0, "Start date should be initialized");
    } else {
        assert.strictEqual(order.orderStage.toNumber(), 0, "Should be stage initialization");
    }

    return keyHash;
}

async function takeOrder(deliveryInstance, orderId, key, sender) {
    let tx = await deliveryInstance.takeOrder(
        orderId,
        key,
        {from: sender}
    );

    truffleAssert.eventEmitted(tx, 'OrderTaken', (ev) => {
        return ev.orderId.toNumber() === orderId;
    }, 'OrderTaken should be emitted with correct parameters');

    let order = await deliveryInstance.getOrder.call(orderId);
    assert.strictEqual(order.orderStage.toNumber(), 2, "Should be stage Taken");
}

async function deliverOrder(deliveryInstance, orderId, key, sender) {
    let tx = await deliveryInstance.deliverOrder(
        orderId,
        key,
        {from: sender}
    );

    truffleAssert.eventEmitted(tx, 'OrderDelivered', (ev) => {
        return ev.orderId.toNumber() === orderId;
    }, 'OrderDelivered should be emitted with correct parameters');

    let order = await deliveryInstance.getOrder.call(orderId);
    assert.strictEqual(order.orderStage.toNumber(), 3, "Should be stage Delivered");
}

async function endOrder(deliveryInstance, buyer, seller, deliver, orderId, sender) {
    let escrow = await deliveryInstance.getEscrow.call(orderId);
    let withdrawBalanceSellerBefore = await deliveryInstance.withdraws.call(seller);
    let withdrawBalanceDeliverBefore = await deliveryInstance.withdraws.call(deliver);
    let withdrawBalanceBuyerBefore = await deliveryInstance.withdraws.call(buyer);

    let tx = await deliveryInstance.endOrder(
        orderId,
        {from: sender}
    );

    truffleAssert.eventEmitted(tx, 'OrderEnded', (ev) => {
        return ev.orderId.toNumber() === orderId;
    }, 'OrderEnded should be emitted with correct parameters');

    let order = await deliveryInstance.getOrder.call(orderId);
    assert.strictEqual(order.orderStage.toNumber(), 4, "Should be stage Ended");

    let withdrawBalanceSeller = await deliveryInstance.withdraws.call(seller);
    let withdrawBalanceDeliver = await deliveryInstance.withdraws.call(deliver);
    let withdrawBalanceBuyer = await deliveryInstance.withdraws.call(buyer);

    assert.strictEqual(parseInt(order.sellerPrice) + parseInt(escrow.escrowSeller) + parseInt(withdrawBalanceSellerBefore), parseInt(withdrawBalanceSeller), "Withdraw balance for the seller is wrong");
    assert.strictEqual(parseInt(order.deliverPrice) + parseInt(escrow.escrowDeliver) + parseInt(withdrawBalanceDeliverBefore), parseInt(withdrawBalanceDeliver), "Withdraw balance for the deliver is wrong");
    assert.strictEqual(parseInt(escrow.escrowBuyer) + parseInt(withdrawBalanceBuyerBefore), parseInt(withdrawBalanceBuyer), "Withdraw balance for the buyer is wrong");
}


async function initCancelOrder(deliveryInstance, buyer, seller, deliver, sender, orderId = 0) {
    let order = await deliveryInstance.getOrder.call(orderId);
    let escrow = await deliveryInstance.getEscrow.call(orderId);
    let withdrawBefore = await getWithdraw(deliveryInstance, buyer, seller, deliver);
    let tx = await deliveryInstance.initializationCancel(
        orderId,
        {from: sender}
    );

    truffleAssert.eventEmitted(tx, 'CancelOrder', (ev) => {
        return ev.orderId.toNumber() === orderId &&
            ev.startedOrder === false;
    }, 'CancelOrder should be emitted with correct parameters');

    let orderAfter = await deliveryInstance.getOrder.call(orderId);
    assert.strictEqual(parseInt(orderAfter.orderStage), 5, "Should be stage to order cancel init");

    await checkWithdrawUpdate(deliveryInstance, buyer, seller, deliver, order, withdrawBefore, escrow);
}

async function checkOrderCreationData(deliveryInstance, orderId, buyer, seller, deliver, sellerPrice, deliverPrice, sellerHash, buyerHash, sellerDeliveryPay) {
    let order = await deliveryInstance.getOrder.call(orderId);

    assert.strictEqual(order.buyer, buyer, "Should be this buyer : " + buyer);
    assert.strictEqual(order.seller, seller, "Should be this seller : " + seller);
    assert.strictEqual(order.deliver, deliver, "Should be this deliver : " + deliver);
    assert.strictEqual(parseInt(order.sellerPrice), sellerPrice, "Should be this sellerPrice : " + sellerPrice);
    assert.strictEqual(parseInt(order.deliverPrice), deliverPrice, "Should be this deliverPrice : " + deliverPrice);
    assert.strictEqual(parseInt(order.sellerDeliveryPay), sellerDeliveryPay, "Should be this sellerDeliveryPay : " + sellerDeliveryPay);
    assert.strictEqual(parseInt(order.orderStage), 0, "Should be stage to initialization");
    assert.strictEqual(parseInt(order.startDate), 0, "Should be start date init to 0");
    assert.strictEqual(order.buyerValidation, false, "Should be false");
    assert.strictEqual(order.sellerValidation, false, "Should be false");
    assert.strictEqual(order.deliverValidation, false, "Should be false");
    assert.strictEqual(order.sellerHash, sellerHash, "Seller hash is wrong");
    assert.strictEqual(order.buyerHash, buyerHash, "Buyer hash is wrong");
}

async function checkEscrowCreationData(deliveryInstance, orderId, delay, escrowBuyer, escrowSeller, escrowDeliver) {
    let escrow = await deliveryInstance.getEscrow.call(orderId);

    assert.strictEqual(parseInt(escrow.delayEscrow), delay, "Should be this delay : " + delay);
    assert.strictEqual(parseInt(escrow.escrowBuyer), escrowBuyer, "Wrong escrow buyer : " + escrowBuyer);
    assert.strictEqual(parseInt(escrow.escrowSeller), escrowSeller, "Wrong escrow seller : " + escrowSeller);
    assert.strictEqual(parseInt(escrow.escrowDeliver), escrowDeliver, "Wrong escrow deliver : " + escrowDeliver);
}

Object.assign(exports, {
    createOrder,
    validateOrder,
    takeOrder,
    deliverOrder,
    initCancelOrder,
    updateInitializeOrder,
    checkEscrowCreationData,
    endOrder
});