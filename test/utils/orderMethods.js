const truffleAssert = require('truffle-assertions');
const assert = require('assert');
const {SELLER_PRICE, DELIVER_PRICE, DELAY_ORDER, DEFAULT_HASH, actors} = require('./constants');
const {generateKeyHash} = require('./tools');
const DEFAULT_ESCROW_VALUE = SELLER_PRICE + DELIVER_PRICE;

async function createOrder(deliveryInstance, buyer, seller, deliver, sender, orderId = 0, sellerPrice = SELLER_PRICE, deliverPrice = DELIVER_PRICE, delayEscrow = DELAY_ORDER, escrowBuyer = DEFAULT_ESCROW_VALUE, escrowSeller = DEFAULT_ESCROW_VALUE * 2, escrowDeliver = DEFAULT_ESCROW_VALUE * 3) {
    let tx = await deliveryInstance.createOrder(
        [buyer, seller, deliver],
        sellerPrice,
        deliverPrice,
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
    await checkOrderCreationData(deliveryInstance, orderId, buyer, seller, deliver, sellerPrice, deliverPrice, DEFAULT_HASH, DEFAULT_HASH);
    await checkEscrowCreationData(deliveryInstance, orderId, delayEscrow, escrowBuyer, escrowSeller, escrowDeliver);
}


async function updateInitializeOrder(deliveryInstance, buyer, seller, deliver, sellerPrice, deliverPrice, delayEscrow = DELAY_ORDER, sender, orderId = 0, escrowBuyer = DEFAULT_ESCROW_VALUE, escrowSeller = DEFAULT_ESCROW_VALUE * 2, escrowDeliver = DEFAULT_ESCROW_VALUE * 3) {
    let order = await deliveryInstance.getOrder.call(orderId);
    let escrow = await deliveryInstance.getEscrow.call(orderId);
    let withdrawBefore = await getWithdraw(deliveryInstance, buyer, seller, deliver);
    let tx = await deliveryInstance.updateInitializeOrder(
        orderId,
        sellerPrice,
        deliverPrice,
        delayEscrow,
        escrowBuyer,
        escrowSeller,
        escrowDeliver,
        {from: sender}
    );

    truffleAssert.eventEmitted(tx, 'OrderUpdated', (ev) => {
        return ev.orderId.toNumber() === orderId;
    }, 'OrderUpdated should be emitted with correct parameters');

    await checkWithdrawUpdate(deliveryInstance, buyer, seller, deliver, order, withdrawBefore, escrow);
    await checkOrderCreationData(deliveryInstance, orderId, buyer, seller, deliver, sellerPrice, deliverPrice, order.sellerHash, order.buyerHash);
    await checkEscrowCreationData(deliveryInstance, orderId, delayEscrow, escrowBuyer, escrowSeller, escrowDeliver);
}

async function validateOrder(deliveryInstance, typeValidation, sender, amountEth, orderId, shouldBeStarted, buyerValidation, sellerValidation, deliverValidation) {
    let keyHash = generateKeyHash();

    let tx = "";
    let eventType = "";
    if (typeValidation === actors.SELLER) {
        tx = await deliveryInstance.validateSeller(
            orderId,
            keyHash.hash,
            {from: sender, value: amountEth}
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
            {from: sender, value: amountEth}
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
        DEFAULT_ESCROW_VALUE * 2,
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
        DELIVER_PRICE + SELLER_PRICE + DEFAULT_ESCROW_VALUE,
        orderId,
        true,
        true,
        true,
        true);

    return {keyHashSeller, keyHashBuyer};
}

async function deliverOrder(deliveryInstance, buyer, seller, deliver, orderId, key, sender) {
    let escrow = await deliveryInstance.getEscrow.call(orderId);
    let withdrawBalanceSellerBefore = await deliveryInstance.withdraws.call(seller);
    let withdrawBalanceDeliverBefore = await deliveryInstance.withdraws.call(deliver);
    let withdrawBalanceBuyerBefore = await deliveryInstance.withdraws.call(buyer);

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
    let withdrawBalanceBuyer = await deliveryInstance.withdraws.call(buyer);

    assert.strictEqual(parseInt(order.sellerPrice) + parseInt(escrow.escrowSeller) + parseInt(withdrawBalanceSellerBefore), parseInt(withdrawBalanceSeller), "Withdraw balance for the seller is wrong");
    assert.strictEqual(parseInt(order.deliverPrice) + parseInt(escrow.escrowDeliver) + parseInt(withdrawBalanceDeliverBefore), parseInt(withdrawBalanceDeliver), "Withdraw balance for the deliver is wrong");
    assert.strictEqual(parseInt(escrow.escrowBuyer) + parseInt(withdrawBalanceBuyerBefore), parseInt(withdrawBalanceBuyer), "Withdraw balance for the buyer is wrong");
}

async function fullDeliveredOrder(deliveryInstance, buyer, seller, deliver, orderId) {
    await createOrder(deliveryInstance, buyer, seller, deliver, buyer, orderId);
    let {keyHashSeller, keyHashBuyer} = await completeValidationOrder(deliveryInstance, buyer, seller, deliver, orderId);
    await takeOrder(deliveryInstance, orderId, keyHashSeller.key, deliver);
    await deliverOrder(deliveryInstance, buyer, seller, deliver, orderId, keyHashBuyer.key, deliver);
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
    assert.strictEqual(parseInt(orderAfter.orderStage), 4, "Should be stage to order cancel init");

    await checkWithdrawUpdate(deliveryInstance, buyer, seller, deliver, order, withdrawBefore, escrow);
}

async function checkOrderCreationData(deliveryInstance, orderId, buyer, seller, deliver, sellerPrice, deliverPrice, sellerHash, buyerHash) {
    let order = await deliveryInstance.getOrder.call(orderId);

    assert.strictEqual(order.buyer, buyer, "Should be this buyer : " + buyer);
    assert.strictEqual(order.seller, seller, "Should be this seller : " + seller);
    assert.strictEqual(order.deliver, deliver, "Should be this deliver : " + deliver);
    assert.strictEqual(parseInt(order.sellerPrice), sellerPrice, "Should be this sellerPrice : " + sellerPrice);
    assert.strictEqual(parseInt(order.deliverPrice), deliverPrice, "Should be this deliverPrice : " + deliverPrice);
    assert.strictEqual(parseInt(order.orderStage), 0, "Should be stage to initialization");
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

async function getWithdraw(deliveryInstance, buyer, seller, deliver) {
    let withdrawBalanceSeller = await deliveryInstance.withdraws.call(seller);
    let withdrawBalanceDeliver = await deliveryInstance.withdraws.call(deliver);
    let withdrawBalanceBuyer = await deliveryInstance.withdraws.call(buyer);

    withdrawBalanceDeliver = parseInt(withdrawBalanceDeliver);
    withdrawBalanceSeller = parseInt(withdrawBalanceSeller);
    withdrawBalanceBuyer = parseInt(withdrawBalanceBuyer);

    return {
        buyer: withdrawBalanceBuyer,
        seller: withdrawBalanceSeller,
        deliver: withdrawBalanceDeliver
    }
}

async function checkWithdrawUpdate(deliveryInstance, buyer, seller, deliver, order, withdrawBefore, escrow) {
    let withdrawAfter = await getWithdraw(deliveryInstance, buyer, seller, deliver);
    if (order.buyerValidation) {
        assert.strictEqual(parseInt(withdrawAfter.buyer), withdrawBefore.buyer + parseInt(order.sellerPrice) + parseInt(order.deliverPrice) + parseInt(escrow.escrowBuyer), "Withdraw balance should be filled");
    } else {
        assert.strictEqual(parseInt(withdrawAfter.buyer), withdrawBefore.buyer, "Buyer Withdraw balance should be 0");
    }

    if (order.sellerValidation) {
        assert.strictEqual(parseInt(withdrawAfter.seller), withdrawBefore.seller + parseInt(escrow.escrowSeller), "Withdraw balance should be filled");
    } else {
        assert.strictEqual(parseInt(withdrawAfter.seller), withdrawBefore.seller, "Seller Withdraw balance should be 0");
    }

    if (order.deliverValidation) {
        assert.strictEqual(parseInt(withdrawAfter.deliver), withdrawBefore.deliver + parseInt(escrow.escrowDeliver), "Withdraw balance should be filled");
    } else {
        assert.strictEqual(parseInt(withdrawAfter.deliver), withdrawBefore.deliver, "Deliver Withdraw balance should be 0");
    }
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