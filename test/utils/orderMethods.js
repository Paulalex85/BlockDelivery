const truffleAssert = require('truffle-assertions');
const assert = require('assert');
const {SELLER_PRICE, DELIVER_PRICE, DELAY_ORDER, DEFAULT_HASH, actors} = require('./constants');
const {generateKeyHash} = require('./tools');

async function createOrder(deliveryInstance, buyer, seller, deliver, sender, orderId = 0) {
    let tx = await deliveryInstance.createOrder(
        buyer,
        seller,
        deliver,
        SELLER_PRICE,
        DELIVER_PRICE,
        DELAY_ORDER,
        {from: sender}
    );

    truffleAssert.eventEmitted(tx, 'NewOrder', (ev) => {
        return ev.buyer === buyer
            && ev.seller === seller
            && ev.deliver === deliver
            && ev.orderId.toNumber() === orderId;
    }, 'NewOrder should be emitted with correct parameters');
    await checkOrderCreationData(deliveryInstance, orderId, buyer, seller, deliver, SELLER_PRICE, DELIVER_PRICE, DEFAULT_HASH, DEFAULT_HASH, DELAY_ORDER);
}

async function updateInitializeOrder(deliveryInstance, buyer, seller, deliver, sellerPrice, deliverPrice, delayEscrow, sender, orderId = 0) {
    let order = await deliveryInstance.getOrder.call(orderId);

    let tx = await deliveryInstance.updateInitializeOrder(
        orderId,
        sellerPrice,
        deliverPrice,
        delayEscrow,
        {from: sender}
    );

    truffleAssert.eventEmitted(tx, 'OrderUpdated', (ev) => {
        return ev.orderId.toNumber() === orderId;
    }, 'OrderUpdated should be emitted with correct parameters');

    let withdrawBalance = await deliveryInstance.withdraws.call(
        sender
    );
    if (order.buyerValidation) {
        assert.strictEqual(parseInt(withdrawBalance), parseInt(order.sellerPrice) + parseInt(order.deliverPrice), "Withdraw balance should be filled");
    } else {
        assert.strictEqual(parseInt(withdrawBalance), 0, "Withdraw balance should be 0");
    }

    await checkOrderCreationData(deliveryInstance, orderId, buyer, seller, deliver, sellerPrice, deliverPrice, order.sellerHash, order.buyerHash, delayEscrow);
}

async function validateOrder(deliveryInstance, typeValidation, sender, amountEth, orderId, shouldBeStarted, buyerValidation, sellerValidation, deliverValidation) {
    let keyHash = generateKeyHash();

    let tx = "";
    let eventType = "";
    if (typeValidation === actors.SELLER) {
        tx = await deliveryInstance.validateSeller(
            orderId,
            keyHash.hash,
            {from: sender}
        );
        eventType = "SellerValidate";
    } else if (typeValidation === actors.BUYER) {
        tx = await deliveryInstance.validateBuyer(
            orderId,
            keyHash.hash,
            {from: sender, value: amountEth}
        );
        eventType = "BuyerValidate";
    } else if (typeValidation === actors.DELIVER) {
        tx = await deliveryInstance.validateDeliver(
            orderId,
            {from: sender}
        );
        eventType = "DeliverValidate";
    }

    truffleAssert.eventEmitted(tx, eventType, (ev) => {
        return ev.orderId.toNumber() === orderId
            && ev.isOrderStarted === shouldBeStarted;
    }, eventType + ' should be emitted with correct parameters');

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
    } else {
        assert.strictEqual(order.orderStage.toNumber(), 0, "Should be stage initialization");
    }

    return keyHash;
}

async function takeOrder(deliveryInstance, orderId, key, sender) {
    let tx = await deliveryInstance.orderTaken(
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

async function completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId) {
    let keyHashSeller = await validateOrder(deliveryInstance,
        actors.SELLER,
        seller,
        0,
        orderId,
        false,
        false,
        true,
        false);
    await validateOrder(deliveryInstance,
        actors.DELIVER,
        deliver,
        0,
        orderId,
        false,
        false,
        true,
        true);
    let keyHashBuyer = await validateOrder(deliveryInstance,
        actors.BUYER,
        buyer,
        DELIVER_PRICE + SELLER_PRICE,
        orderId,
        true,
        true,
        true,
        true);

    return {keyHashSeller, keyHashBuyer};
}

async function deliverOrder(deliveryInstance, seller, deliver, orderId, key, sender) {

    let withdrawBalanceSellerBefore = await deliveryInstance.withdraws.call(seller);
    let withdrawBalanceDeliverBefore = await deliveryInstance.withdraws.call(deliver);

    let tx = await deliveryInstance.orderDelivered(
        orderId,
        key,
        {from: sender}
    );

    truffleAssert.eventEmitted(tx, 'OrderDelivered', (ev) => {
        return ev.orderId.toNumber() === orderId;
    }, 'OrderDelivered should be emitted with correct parameters');

    let order = await deliveryInstance.getOrder.call(orderId);
    assert.strictEqual(order.orderStage.toNumber(), 3, "Should be stage Delivered");

    let withdrawBalanceSeller = await deliveryInstance.withdraws.call(seller);
    let withdrawBalanceDeliver = await deliveryInstance.withdraws.call(deliver);

    assert.strictEqual(parseInt(order.sellerPrice) + parseInt(withdrawBalanceSellerBefore), parseInt(withdrawBalanceSeller), "Withdraw balance for the seller is wrong");
    assert.strictEqual(parseInt(order.deliverPrice) + parseInt(withdrawBalanceDeliverBefore), parseInt(withdrawBalanceDeliver), "Withdraw balance for the deliver is wrong");
}

async function fullDeliveredOrder(deliveryInstance, buyer, seller, deliver, orderId) {
    await createOrder(deliveryInstance, buyer, seller, deliver, buyer, orderId);
    let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
    await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
    await deliverOrder(deliveryInstance, seller, deliver, orderId, keyHashBuyer.key, deliver);
}

async function withdrawBalance(deliveryInstance, sender) {
    await deliveryInstance.withdrawBalance(
        {from: sender}
    );

    let withdrawBalance = await deliveryInstance.withdraws.call(
        sender
    );
    assert.strictEqual(parseInt(withdrawBalance), 0, "Withdraw balance should be 0");
}

async function initCancelOrder(deliveryInstance, sender, buyer, orderId = 0) {
    let tx = await deliveryInstance.initializationCancel(
        orderId,
        {from: sender}
    );

    truffleAssert.eventEmitted(tx, 'CancelOrder', (ev) => {
        return ev.orderId.toNumber() === orderId &&
            ev.startedOrder === false;
    }, 'CancelOrder should be emitted with correct parameters');

    let order = await deliveryInstance.getOrder.call(orderId);
    assert.strictEqual(order.orderStage.toNumber(), 4, "Should be stage to order cancel init");

    let withdrawBalance = await deliveryInstance.withdraws.call(
        buyer
    );
    if (order.buyerValidation === true) {
        assert.strictEqual(parseInt(withdrawBalance), SELLER_PRICE + DELIVER_PRICE, "Withdraw balance should be the amount paid by the buyer");
    } else {
        assert.strictEqual(parseInt(withdrawBalance), 0, "Withdraw balance should be 0");
    }
}

async function checkOrderCreationData(deliveryInstance, orderId, buyer, seller, deliver, sellerPrice, deliverPrice, sellerHash, buyerHash, delay) {
    let order = await deliveryInstance.getOrder.call(orderId);

    assert.strictEqual(order.buyer, buyer, "Should be this buyer : " + buyer);
    assert.strictEqual(order.seller, seller, "Should be this seller : " + seller);
    assert.strictEqual(order.deliver, deliver, "Should be this deliver : " + deliver);
    assert.strictEqual(order.sellerPrice.toNumber(), sellerPrice, "Should be this sellerPrice : " + sellerPrice);
    assert.strictEqual(order.deliverPrice.toNumber(), deliverPrice, "Should be this deliverPrice : " + deliverPrice);
    assert.strictEqual(order.orderStage.toNumber(), 0, "Should be stage to initialization");
    assert.strictEqual(order.delayEscrow.toNumber(), delay, "Should be this delay : " + delay);
    assert.strictEqual(order.buyerValidation, false, "Should be false");
    assert.strictEqual(order.sellerValidation, false, "Should be false");
    assert.strictEqual(order.deliverValidation, false, "Should be false");
    assert.strictEqual(order.sellerHash, sellerHash, "Seller hash is wrong");
    assert.strictEqual(order.buyerHash, buyerHash, "Buyer hash is wrong");
}

Object.assign(exports, {
    createOrder,
    validateOrder,
    completeValidationOrder,
    takeOrder,
    deliverOrder,
    fullDeliveredOrder,
    withdrawBalance,
    initCancelOrder,
    updateInitializeOrder
});